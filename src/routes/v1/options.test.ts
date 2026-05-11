import { Hono } from 'hono'
import { exportJWK, generateKeyPair, type JWK, SignJWT } from 'jose'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { applyCoreMiddleware } from '../../middleware'
import type { AppEnv, Bindings } from '../../types/app'
import { optionsRoutes } from './options'

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
  app.route('/v1', optionsRoutes)
  return app
}

const callOptions = (
  path = '/v1/options',
  init: RequestInit = {},
): Promise<Response> => {
  const app = buildApp()
  const env: Bindings = { SUPABASE_PROJECT_URL: PROJECT_URL }
  return app.request(path, init, env)
}

describe('GET /v1/options', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await callOptions()
    expect(res.status).toBe(401)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('unauthorized')
  })

  it('returns 400 when locale is unsupported', async () => {
    const token = await mintToken()
    const res = await callOptions('/v1/options?locale=zz', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('bad_request')
  })

  it('returns 200 with all 14 option lists when no locale is given (default en)', async () => {
    const token = await mintToken()
    const res = await callOptions('/v1/options', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(Array.isArray(body.goals)).toBe(true)
    expect((body.goals as unknown[]).length).toBeGreaterThan(0)
    const goal0 = (body.goals as Array<{ value: string; label: string }>)[0]
    expect(typeof goal0.value).toBe('string')
    expect(typeof goal0.label).toBe('string')
    expect(typeof body.requestId).toBe('string')
    expect(Array.isArray(body.muscles)).toBe(true)
    const muscle0 = (
      body.muscles as Array<{ value: string; label: string; simple_label: string }>
    )[0]
    expect(typeof muscle0.simple_label).toBe('string')
    const expectedKeys = [
      'biologicalSexes',
      'blockTypes',
      'bodyParts',
      'canonicalGoals',
      'conditions',
      'equipment',
      'equipmentAccess',
      'excludableBlocks',
      'experienceLevels',
      'goals',
      'injuries',
      'movementPatterns',
      'muscles',
      'setTypes',
    ]
    for (const k of expectedKeys) {
      expect(Array.isArray(body[k])).toBe(true)
    }
  })

  it.each(['en', 'es', 'pt-BR', 'fr'])(
    'returns 200 with a stable value-ordered list for locale=%s',
    async (locale) => {
      const token = await mintToken()
      const res = await callOptions(`/v1/options?locale=${locale}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      expect(res.status).toBe(200)
      const body = (await res.json()) as {
        goals: Array<{ value: string; label: string }>
      }
      expect(body.goals.length).toBeGreaterThan(0)
      for (const opt of body.goals) {
        expect(typeof opt.value).toBe('string')
        expect(typeof opt.label).toBe('string')
        expect(opt.label.length).toBeGreaterThan(0)
      }
    },
  )
})
