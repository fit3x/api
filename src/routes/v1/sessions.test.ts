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

const callGenerate = (init: RequestInit = {}): Promise<Response> => {
  const app = buildApp()
  const env: Bindings = { SUPABASE_PROJECT_URL: PROJECT_URL }
  return app.request('/v1/sessions/generate', init, env)
}

const minimalValidInput = () => ({
  customer_profile: {
    constraints: {
      available_days_per_week: 4,
      equipment_access: 'full_gym',
      session_duration_max_minutes: 60,
    },
    demographics: { age: 30, biological_sex: 'male' },
    goals: { primary_goal: 'build_muscle' },
    training_background: { experience_level: 'intermediate' },
    user_id: 'user-123',
  },
  generation_request: { scope: 'single_session' },
  version: '1.0.0',
})

describe('POST /v1/sessions/generate', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await callGenerate({
      body: JSON.stringify(minimalValidInput()),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
    expect(res.status).toBe(401)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('unauthorized')
  })

  it('returns 400 when the body is not JSON', async () => {
    const token = await mintToken()
    const res = await callGenerate({
      body: '{not-json',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('bad_request')
  })

  it('returns 400 when required fields are missing', async () => {
    const token = await mintToken()
    const res = await callGenerate({
      body: JSON.stringify({
        customer_profile: {},
        generation_request: { scope: 'single_session' },
        version: '1.0.0',
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as {
      error?: { code?: string; issues?: unknown[] }
    }
    expect(body.error?.code).toBe('bad_request')
    expect(Array.isArray(body.error?.issues)).toBe(true)
    expect((body.error?.issues ?? []).length).toBeGreaterThan(0)
  })

  it('returns 400 when an enum value is not in the supported set', async () => {
    const token = await mintToken()
    const bad = minimalValidInput()
    // @ts-expect-error - intentionally invalid enum to test 400 path
    bad.customer_profile.goals.primary_goal = 'become_a_wizard'
    const res = await callGenerate({
      body: JSON.stringify(bad),
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('bad_request')
  })

  it('returns 200 with a generated session for a minimal valid input', async () => {
    const token = await mintToken()
    const res = await callGenerate({
      body: JSON.stringify(minimalValidInput()),
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      version: string
      workout_program: { mode: string; id: string }
      workout_sessions: Array<{ id: string; blocks: unknown[] }>
      generation_scope: string
      generation_metadata: { engine_version: string }
      requestId: string
    }
    expect(typeof body.version).toBe('string')
    expect(['existing_reference', 'full']).toContain(body.workout_program.mode)
    expect(Array.isArray(body.workout_sessions)).toBe(true)
    expect(body.workout_sessions.length).toBeGreaterThan(0)
    expect(Array.isArray(body.workout_sessions[0].blocks)).toBe(true)
    expect(body.generation_scope).toBe('single_session')
    expect(typeof body.generation_metadata.engine_version).toBe('string')
    expect(typeof body.requestId).toBe('string')
  })
})
