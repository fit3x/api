import { getPrograms } from '@fit3x/workout-engine'
import { Hono } from 'hono'
import { exportJWK, generateKeyPair, type JWK, SignJWT } from 'jose'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { applyCoreMiddleware } from '../../middleware'
import type { AppEnv, Bindings } from '../../types/app'
import { sessionsRoutes } from './sessions'

const PROJECT_URL = 'https://test.supabase.co'
const JWKS_URL = `${PROJECT_URL}/auth/v1/.well-known/jwks.json`
const ISSUER = `${PROJECT_URL}/auth/v1`
const AUDIENCE = 'authenticated'
const KID = 'test-key'

type FixtureKey = {
  privateKey: CryptoKey
  publicJwk: JWK
}

let primaryKey: FixtureKey

const resolveUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url
}

beforeAll(async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256', {
    extractable: true,
  })
  const publicJwk = await exportJWK(publicKey)
  publicJwk.alg = 'RS256'
  publicJwk.use = 'sig'
  publicJwk.kid = KID
  primaryKey = { privateKey, publicJwk }

  vi.stubGlobal(
    'fetch',
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = resolveUrl(input)
      if (url === JWKS_URL) {
        return new Response(JSON.stringify({ keys: [primaryKey.publicJwk] }), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        })
      }
      throw new Error(`Unmocked fetch in test: ${init?.method ?? 'GET'} ${url}`)
    },
  )
})

afterAll(() => {
  vi.unstubAllGlobals()
})

const mintToken = async (subject = 'user-123'): Promise<string> => {
  return new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'RS256', kid: KID })
    .setSubject(subject)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(primaryKey.privateKey)
}

const buildApp = () => {
  const app = new Hono<AppEnv>()
  applyCoreMiddleware(app)
  app.route('/v1', sessionsRoutes)
  return app
}

const call = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const app = buildApp()
  const env: Bindings = { SUPABASE_PROJECT_URL: PROJECT_URL }
  return app.request(path, init, env)
}

const post = async (body: unknown): Promise<Response> => {
  const token = await mintToken()
  return call('/v1/sessions/generate', {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    method: 'POST',
  })
}

const get = async (path: string): Promise<Response> => {
  const token = await mintToken()
  return call(path, { headers: { Authorization: `Bearer ${token}` } })
}

/** Input contract v3.0.0. single_session requires constraints.body_parts. */
const singleSessionInput = () => ({
  customer_profile: {
    constraints: {
      available_days_per_week: 4,
      available_equipment: ['barbell', 'dumbbell', 'cable', 'body_weight'],
      body_parts: ['chest'],
      session_duration_minutes: 60,
    },
    demographics: { age: 30, biological_sex: 'male' },
    goals: { goals: ['build_muscle'] },
    training_background: { experience_level: 'intermediate' },
    user_id: 'user-123',
  },
  generation_request: { scope: 'single_session' },
  version: '3.0.0',
})

const weekInput = (programId?: string) => ({
  customer_profile: {
    constraints: {
      available_days_per_week: 3,
      available_equipment: ['body_weight', 'dumbbell', 'bench'],
      session_duration_minutes: 45,
    },
    demographics: { age: 30, biological_sex: 'male' },
    goals: { goals: ['build_muscle'] },
    training_background: { experience_level: 'intermediate' },
    user_id: 'user-123',
  },
  generation_request: {
    scope: 'week_sessions',
    ...(programId === undefined ? {} : { program_id: programId }),
  },
  version: '3.0.0',
})

type ErrorBody = { error?: { code?: string; issues?: unknown[] } }

describe('POST /v1/sessions/generate', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await call('/v1/sessions/generate', {
      body: JSON.stringify(singleSessionInput()),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
    expect(res.status).toBe(401)
    expect(((await res.json()) as ErrorBody).error?.code).toBe('unauthorized')
  })

  it('returns 400 when the body is not JSON', async () => {
    const token = await mintToken()
    const res = await call('/v1/sessions/generate', {
      body: '{not-json',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    })
    expect(res.status).toBe(400)
    expect(((await res.json()) as ErrorBody).error?.code).toBe('bad_request')
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await post({
      customer_profile: {},
      generation_request: { scope: 'single_session' },
      version: '3.0.0',
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as ErrorBody
    expect(body.error?.code).toBe('bad_request')
    expect((body.error?.issues ?? []).length).toBeGreaterThan(0)
  })

  it('returns 400 for a goal outside the v3 four-goal vocabulary', async () => {
    const bad = singleSessionInput()
    // improve_mobility was a valid v2 goal; v3 removed it.
    bad.customer_profile.goals.goals[0] = 'improve_mobility'
    const res = await post(bad)
    expect(res.status).toBe(400)
    expect(((await res.json()) as ErrorBody).error?.code).toBe('bad_request')
  })

  it('names removed v2 fields instead of failing opaquely', async () => {
    const stale = singleSessionInput() as Record<string, unknown>
    const profile = stale.customer_profile as Record<string, unknown>
    const constraints = profile.constraints as Record<string, unknown>
    delete constraints.session_duration_minutes
    constraints.session_duration_max_minutes = 60

    const res = await post(stale)
    expect(res.status).toBe(400)
    const body = (await res.json()) as ErrorBody
    expect(body.error?.code).toBe('unsupported_contract_version')
    expect(JSON.stringify(body.error?.issues)).toContain(
      'session_duration_max_minutes',
    )
  })

  it('returns 400 when single_session omits constraints.body_parts', async () => {
    const input = singleSessionInput() as Record<string, unknown>
    const profile = input.customer_profile as Record<string, unknown>
    delete (profile.constraints as Record<string, unknown>).body_parts

    const res = await post(input)
    expect(res.status).toBe(400)
    const body = (await res.json()) as ErrorBody
    expect(body.error?.code).toBe('bad_request')
    expect(JSON.stringify(body.error?.issues)).toContain('body_parts')
  })

  it('returns 400 for duplicate equipment rather than an opaque 422', async () => {
    const input = singleSessionInput()
    input.customer_profile.constraints.available_equipment = [
      'dumbbell',
      'dumbbell',
      'body_weight',
    ]
    const res = await post(input)
    expect(res.status).toBe(400)
    const body = (await res.json()) as ErrorBody
    expect(body.error?.code).toBe('bad_request')
    expect(JSON.stringify(body.error?.issues)).toContain('available_equipment')
  })

  it('returns 400 for duplicate goals', async () => {
    const input = singleSessionInput()
    input.customer_profile.goals.goals = ['build_muscle', 'build_muscle']
    const res = await post(input)
    expect(res.status).toBe(400)
  })

  it('returns 400 for an unknown top-level key instead of silently dropping it', async () => {
    const input = singleSessionInput() as Record<string, unknown>
    // A misplaced block is a client bug worth surfacing, not ignoring.
    input.constraints = { available_days_per_week: 3 }
    const res = await post(input)
    expect(res.status).toBe(400)
    expect(JSON.stringify((await res.json()) as ErrorBody)).toContain(
      'constraints',
    )
  })

  it('returns 400 when program_id is sent with single_session', async () => {
    const input = singleSessionInput() as Record<string, unknown>
    input.generation_request = {
      program_id: getPrograms().programs[0]!.id,
      scope: 'single_session',
    }
    const res = await post(input)
    expect(res.status).toBe(400)
    expect(JSON.stringify((await res.json()) as ErrorBody)).toContain(
      'program_id',
    )
  })

  it('returns 404 for a program_id that does not resolve', async () => {
    const res = await post(weekInput('not-a-real-program-id'))
    expect(res.status).toBe(404)
    expect(((await res.json()) as ErrorBody).error?.code).toBe(
      'program_not_found',
    )
  })

  it('generates a single session from the standalone catalog', async () => {
    const res = await post(singleSessionInput())
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      version: string
      workout_program: { mode: string; id: string }
      exercises_pool: Record<string, { exercise_id: string; name: string }>
      workout_sessions: Array<{
        id: string
        sets: Array<{
          set_number: number
          rounds: number
          exercises: Array<{ exercise_ref: Record<string, unknown> }>
        }>
      }>
      generation_scope: string
      generation_metadata: {
        engine_version: string
        seed: number | null
        warnings: Array<{ code: string; message: string }>
        selected_program: { source?: string } | null
      }
      requestId: string
    }

    expect(body.version).toBe('3.0.0')
    expect(body.workout_program.mode).toBe('full')
    expect(body.generation_scope).toBe('single_session')
    expect(body.workout_sessions.length).toBeGreaterThan(0)
    expect(typeof body.requestId).toBe('string')

    const sets = body.workout_sessions[0]!.sets
    expect(sets.length).toBeGreaterThan(0)
    // v3 removed block_type — sets are flat and ordered by set_number.
    expect(sets[0]).not.toHaveProperty('block_type')
    expect(typeof sets[0]!.set_number).toBe('number')

    const ref = sets[0]!.exercises[0]!.exercise_ref
    expect(Object.keys(ref)).toEqual(['exercise_id'])
    expect(body.exercises_pool[ref.exercise_id as string]).toBeDefined()

    // Metadata must survive the output assertion — it carries the disclosures.
    expect(Array.isArray(body.generation_metadata.warnings)).toBe(true)
    expect(body.generation_metadata.engine_version).toBeTruthy()
    expect(body.generation_metadata.selected_program?.source).toBe(
      'session_catalog',
    )
  })

  it('honours a caller-pinned program and reports it as pinned', async () => {
    const program = getPrograms().programs.find((p) => p.gender === 'male')!
    const res = await post(weekInput(program.id))
    expect(res.status).toBe(200)

    const body = (await res.json()) as {
      generation_metadata: {
        selected_program: {
          id: string
          score: number | null
          rank: number | null
          selected?: string
        } | null
        selection_fallbacks: unknown[]
      }
    }

    const selected = body.generation_metadata.selected_program
    expect(selected?.id).toBe(program.id)
    expect(selected?.selected).toBe('pinned')
    // A pinned program is never scored and never runs the fallback ladder.
    expect(selected?.score).toBeNull()
    expect(selected?.rank).toBeNull()
    expect(body.generation_metadata.selection_fallbacks).toEqual([])
  })

  it('scores a program when none is pinned', async () => {
    const res = await post(weekInput())
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      generation_metadata: {
        selected_program: { selected?: string; rank: number | null } | null
      }
    }
    const selected = body.generation_metadata.selected_program
    expect(selected?.selected ?? 'scored').toBe('scored')
    expect(typeof selected?.rank).toBe('number')
  })
})

describe('GET /v1/sessions/catalog', () => {
  it('requires auth', async () => {
    const res = await call('/v1/sessions/catalog')
    expect(res.status).toBe(401)
  })

  it('lists standalone sessions and filters by body part', async () => {
    const res = await get('/v1/sessions/catalog?focus_body_parts=abs&gender=male')
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      count: number
      sessions: Array<{ focus_body_parts: string[]; gender: string }>
      requestId: string
    }
    expect(body.count).toBeGreaterThan(0)
    expect(body.sessions.length).toBe(body.count)
    for (const s of body.sessions) {
      expect(s.gender).toBe('male')
      // Default match mode is "subset": never trains an unselected part.
      expect(s.focus_body_parts).toEqual(['abs'])
    }
  })

  it('rejects an unknown body part', async () => {
    const res = await get('/v1/sessions/catalog?focus_body_parts=elbows')
    expect(res.status).toBe(400)
    expect(((await res.json()) as ErrorBody).error?.code).toBe('bad_request')
  })
})

describe('GET /v1/sessions/coverage', () => {
  it('reports eligible/full counts per body-part combination', async () => {
    const res = await get('/v1/sessions/coverage')
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      max_combination_size: number
      by_gender: Record<string, Record<string, { eligible: number; full: number }>>
      requestId: string
    }
    expect(body.max_combination_size).toBeGreaterThan(0)
    expect(Object.keys(body.by_gender).sort()).toEqual(['female', 'male'])
    expect(body.by_gender.male!.abs!.eligible).toBeGreaterThan(0)
  })
})
