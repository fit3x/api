import { Hono } from 'hono'
import { exportJWK, generateKeyPair, type JWK, SignJWT } from 'jose'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import type { AppEnv, Bindings } from '../types/app'
import { requireSupabaseAuth } from './auth'

const PROJECT_URL = 'https://test.supabase.co'
const JWKS_URL = `${PROJECT_URL}/auth/v1/.well-known/jwks.json`
const ISSUER = `${PROJECT_URL}/auth/v1`
const AUDIENCE = 'authenticated'
const KID = 'test-key'

type FixtureKey = {
  privateKey: CryptoKey
  publicJwk: JWK
}

const generateFixtureKey = async (): Promise<FixtureKey> => {
  const { privateKey, publicKey } = await generateKeyPair('RS256', {
    extractable: true,
  })
  const publicJwk = await exportJWK(publicKey)
  publicJwk.alg = 'RS256'
  publicJwk.use = 'sig'
  publicJwk.kid = KID
  return { privateKey, publicJwk }
}

let primaryKey: FixtureKey
let foreignKey: FixtureKey

const resolveUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url
}

beforeAll(async () => {
  primaryKey = await generateFixtureKey()
  foreignKey = await generateFixtureKey()

  // jose's createRemoteJWKSet caches the JWKS for cacheMaxAge after the first
  // successful fetch, and our middleware caches the JWKS function at module
  // scope by URL. One stub for the suite is enough — every test reuses the
  // same cached key set after the first jwtVerify call.
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

type MintOptions = {
  audience?: string
  expiresAt?: number
  issuer?: string
  signWith?: FixtureKey
  subject?: string
}

const mintToken = async ({
  audience = AUDIENCE,
  expiresAt,
  issuer = ISSUER,
  signWith = primaryKey,
  subject = 'user-123',
}: MintOptions = {}): Promise<string> => {
  const jwt = new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'RS256', kid: KID })
    .setSubject(subject)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()

  if (expiresAt !== undefined) {
    jwt.setExpirationTime(expiresAt)
  } else {
    jwt.setExpirationTime('1h')
  }

  return jwt.sign(signWith.privateKey)
}

const buildApp = () => {
  const app = new Hono<AppEnv>()
  app.use('/protected', requireSupabaseAuth())
  app.get('/protected', (c) => {
    const user = c.get('user')
    return c.json({ ok: true, sub: user.sub })
  })
  return app
}

const callProtected = (init: RequestInit = {}) => {
  const app = buildApp()
  const env: Bindings = { SUPABASE_PROJECT_URL: PROJECT_URL }
  return app.request('/protected', init, env)
}

const expectUnauthorized = async (res: Response) => {
  expect(res.status).toBe(401)
  const body = (await res.json()) as { error?: { code?: string } }
  expect(body.error?.code).toBe('unauthorized')
}

describe('requireSupabaseAuth', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await callProtected()
    await expectUnauthorized(res)
  })

  it('returns 401 when Authorization header is not Bearer', async () => {
    const res = await callProtected({
      headers: { Authorization: 'Basic abc123' },
    })
    await expectUnauthorized(res)
  })

  it('returns 401 when Bearer token is empty', async () => {
    const res = await callProtected({
      headers: { Authorization: 'Bearer    ' },
    })
    await expectUnauthorized(res)
  })

  it('returns 401 when token is signed by an unrelated key', async () => {
    const token = await mintToken({ signWith: foreignKey })
    const res = await callProtected({
      headers: { Authorization: `Bearer ${token}` },
    })
    await expectUnauthorized(res)
  })

  it('returns 401 when token is expired', async () => {
    const token = await mintToken({
      expiresAt: Math.floor(Date.now() / 1000) - 60,
    })
    const res = await callProtected({
      headers: { Authorization: `Bearer ${token}` },
    })
    await expectUnauthorized(res)
  })

  it('returns 401 when issuer does not match', async () => {
    const token = await mintToken({ issuer: 'https://evil.example.com/auth/v1' })
    const res = await callProtected({
      headers: { Authorization: `Bearer ${token}` },
    })
    await expectUnauthorized(res)
  })

  it('returns 401 when audience does not match', async () => {
    const token = await mintToken({ audience: 'service_role' })
    const res = await callProtected({
      headers: { Authorization: `Bearer ${token}` },
    })
    await expectUnauthorized(res)
  })

  it('passes a valid token through to the handler with the user payload', async () => {
    const token = await mintToken({ subject: 'user-123' })
    const res = await callProtected({
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: boolean; sub: string }
    expect(body).toEqual({ ok: true, sub: 'user-123' })
  })
})
