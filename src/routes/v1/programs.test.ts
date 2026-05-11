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

const callPrograms = (init: RequestInit = {}): Promise<Response> => {
  const app = buildApp()
  const env: Bindings = { SUPABASE_PROJECT_URL: PROJECT_URL }
  return app.request('/v1/programs', init, env)
}

describe('GET /v1/programs', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await callPrograms()
    expect(res.status).toBe(401)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('unauthorized')
  })

  it('returns 200 with a hydrated program catalog', async () => {
    const token = await mintToken()
    const res = await callPrograms({
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      version: string
      generated_at: string
      programs: Array<{
        id: string
        name: string
        program_template_id: string
        template: { id: string; split_type: string }
        session_input_defaults: {
          days_per_week: number
          recommended_experience_level: string
        }
      }>
      lookups: Record<string, unknown>
      requestId: string
    }
    expect(typeof body.version).toBe('string')
    expect(body.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(Array.isArray(body.programs)).toBe(true)
    expect(body.programs.length).toBeGreaterThan(0)
    const first = body.programs[0]
    expect(typeof first.id).toBe('string')
    expect(typeof first.name).toBe('string')
    expect(first.template.id).toBe(first.program_template_id)
    expect(typeof first.session_input_defaults.days_per_week).toBe('number')
    expect(typeof body.lookups).toBe('object')
    expect(typeof body.requestId).toBe('string')
  })
})
