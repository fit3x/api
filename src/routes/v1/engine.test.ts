import { Hono } from 'hono'
import { exportJWK, generateKeyPair, type JWK, SignJWT } from 'jose'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { applyCoreMiddleware } from '../../middleware'
import type { AppEnv, Bindings } from '../../types/app'
import { engineRoutes } from './engine'

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
  app.route('/v1', engineRoutes)
  return app
}

const callEngineVersion = async (init: RequestInit = {}): Promise<Response> => {
  const app = buildApp()
  const env: Bindings = { SUPABASE_PROJECT_URL: PROJECT_URL }
  return app.request('/v1/engine/version', init, env)
}

describe('GET /v1/engine/version', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await callEngineVersion()
    expect(res.status).toBe(401)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('unauthorized')
  })

  it('returns 200 with engine + api versions when authenticated', async () => {
    const token = await mintToken()
    const res = await callEngineVersion({
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      apiVersion: string
      engineVersion: string
      requestId: string
    }
    expect(body.apiVersion).toBe('v1')
    expect(body.engineVersion).toMatch(/^\d+\.\d+\.\d+/)
    expect(typeof body.requestId).toBe('string')
    expect(body.requestId.length).toBeGreaterThan(0)
  })
})
