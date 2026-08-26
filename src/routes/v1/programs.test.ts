import { Hono } from 'hono'
import { exportJWK, generateKeyPair, type JWK, SignJWT } from 'jose'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { applyCoreMiddleware } from '../../middleware'
import type { AppEnv, Bindings } from '../../types/app'
import { programsRoutes } from './programs'

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
  app.route('/v1', programsRoutes)
  return app
}

const callPrograms = async (
  init: RequestInit = {},
  path = '/v1/programs',
): Promise<Response> => {
  const app = buildApp()
  const env: Bindings = { SUPABASE_PROJECT_URL: PROJECT_URL }
  return app.request(path, init, env)
}

describe('GET /v1/programs', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await callPrograms()
    expect(res.status).toBe(401)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('unauthorized')
  })

  it('returns 400 when gender is omitted', async () => {
    const token = await mintToken()
    const res = await callPrograms({
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as {
      error?: { code?: string; issues?: Array<{ path: unknown[] }> }
    }
    expect(body.error?.code).toBe('bad_request')
    expect(body.error?.issues).toContainEqual(
      expect.objectContaining({ path: ['gender'] }),
    )
  })

  it('returns 400 for an unsupported gender value', async () => {
    const token = await mintToken()
    const res = await callPrograms(
      { headers: { Authorization: `Bearer ${token}` } },
      '/v1/programs?gender=other',
    )
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('bad_request')
  })

  it('returns 200 with the v1.3.0 program catalog', async () => {
    const token = await mintToken()
    const res = await callPrograms(
      { headers: { Authorization: `Bearer ${token}` } },
      '/v1/programs?gender=male',
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      version: string
      count: number
      programs: Array<{
        id: string
        name: string
        description: string
        gender: string
        goals: string[]
        difficulty_level: string
        program_template_id: string
        min_days_per_week: number
        max_session_duration_minutes: number
        focus_body_parts: string[]
        duration_weeks: number
      }>
      requestId: string
    }
    expect(typeof body.version).toBe('string')
    expect(body.count).toBeGreaterThan(0)
    expect(body.programs.length).toBe(body.count)
    expect(typeof body.requestId).toBe('string')
    for (const p of body.programs) {
      expect(p.gender).toBe('male')
    }

    const first = body.programs[0]!
    // `id` is what a client sends back as generation_request.program_id.
    expect(typeof first.id).toBe('string')
    expect(first.id.length).toBeGreaterThan(0)
    expect(typeof first.description).toBe('string')
    expect(['male', 'female']).toContain(first.gender)
    expect(['beginner', 'intermediate', 'advanced']).toContain(
      first.difficulty_level,
    )
    expect(typeof first.duration_weeks).toBe('number')
    expect(Array.isArray(first.focus_body_parts)).toBe(true)

    // v1.2.x shape is gone.
    expect(first).not.toHaveProperty('template')
    expect(first).not.toHaveProperty('session_input_defaults')
    expect(body).not.toHaveProperty('lookups')
  })

  it('filters by gender and goal', async () => {
    const token = await mintToken()
    const res = await callPrograms(
      { headers: { Authorization: `Bearer ${token}` } },
      '/v1/programs?gender=female&goals=build_muscle',
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      count: number
      programs: Array<{ gender: string; goals: string[] }>
    }
    expect(body.count).toBeGreaterThan(0)
    for (const p of body.programs) {
      expect(p.gender).toBe('female')
      expect(p.goals).toContain('build_muscle')
    }
  })

  it('returns 400 for an unsupported filter value', async () => {
    const token = await mintToken()
    const res = await callPrograms(
      { headers: { Authorization: `Bearer ${token}` } },
      '/v1/programs?gender=male&goals=improve_mobility',
    )
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('bad_request')
  })
})
