import { getMuscleOptions } from '@fit3x/workout-engine'
import { Hono } from 'hono'
import { exportJWK, generateKeyPair, type JWK, SignJWT } from 'jose'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { applyCoreMiddleware } from '../../middleware'
import type { AppEnv, Bindings } from '../../types/app'
import { programsRoutes } from './programs'
import { sessionsRoutes } from './sessions'

const PROJECT_URL = 'https://test.supabase.co'
const JWKS_URL = `${PROJECT_URL}/auth/v1/.well-known/jwks.json`
const ISSUER = `${PROJECT_URL}/auth/v1`
const AUDIENCE = 'authenticated'
const KID = 'test-key'

let privateKey: CryptoKey
let publicJwk: JWK

const resolveUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url
}

beforeAll(async () => {
  const pair = await generateKeyPair('RS256', { extractable: true })
  privateKey = pair.privateKey
  publicJwk = await exportJWK(pair.publicKey)
  publicJwk.alg = 'RS256'
  publicJwk.use = 'sig'
  publicJwk.kid = KID

  vi.stubGlobal('fetch', async (input: RequestInfo | URL): Promise<Response> => {
    if (resolveUrl(input) === JWKS_URL) {
      return new Response(JSON.stringify({ keys: [publicJwk] }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      })
    }
    throw new Error(`Unmocked fetch: ${resolveUrl(input)}`)
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
})

const get = async (path: string): Promise<Response> => {
  const token = await new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'RS256', kid: KID })
    .setSubject('user-123')
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey)

  const app = new Hono<AppEnv>()
  applyCoreMiddleware(app)
  app.route('/v1', programsRoutes)
  app.route('/v1', sessionsRoutes)
  const env: Bindings = { SUPABASE_PROJECT_URL: PROJECT_URL }
  return app.request(path, { headers: { Authorization: `Bearer ${token}` } }, env)
}

const ASCII_QUOTED_ETAG = /^"[\x21\x23-\x7e]*"$/

describe('catalog ETags', () => {
  it('stays a valid ASCII quoted-string for filtered programs', async () => {
    const res = await get('/v1/programs?gender=male&goals=build_muscle,lose_fat')
    expect(res.status).toBe(200)
    const etag = res.headers.get('ETag')!
    expect(etag).toMatch(ASCII_QUOTED_ETAG)
  })

  it('varies with the filters so a 304 cannot serve the wrong body', async () => {
    const male = await get('/v1/programs?gender=male')
    const female = await get('/v1/programs?gender=female')
    expect(male.headers.get('ETag')).not.toBe(female.headers.get('ETag'))

    // The male ETag must not satisfy the female request.
    const app = await get(
      '/v1/programs?gender=female',
    )
    expect(app.status).toBe(200)
  })

  it('round-trips If-None-Match to a 304', async () => {
    const first = await get('/v1/programs?gender=male')
    const etag = first.headers.get('ETag')!

    const token = await new SignJWT({ role: 'authenticated' })
      .setProtectedHeader({ alg: 'RS256', kid: KID })
      .setSubject('user-123')
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey)

    const app = new Hono<AppEnv>()
    applyCoreMiddleware(app)
    app.route('/v1', programsRoutes)
    const env: Bindings = { SUPABASE_PROJECT_URL: PROJECT_URL }
    const second = await app.request(
      '/v1/programs?gender=male',
      { headers: { Authorization: `Bearer ${token}`, 'If-None-Match': etag } },
      env,
    )
    expect(second.status).toBe(304)
  })

  it('rejects an unknown muscle id with a 400 rather than a 500', async () => {
    const res = await get(
      '/v1/sessions/catalog?focus_muscles=%E6%97%A5%E6%9C%AC%E8%AA%9E',
    )
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('bad_request')
  })

  it('rejects a body-part id sent as a muscle id (the natural client mistake)', async () => {
    const res = await get('/v1/sessions/catalog?focus_muscles=chest')
    expect(res.status).toBe(400)
  })

  it('keeps the header ASCII for a valid muscle filter', async () => {
    const muscleId = getMuscleOptions('en')[0]!.value
    const res = await get(`/v1/sessions/catalog?focus_muscles=${muscleId}`)
    expect(res.status).toBe(200)
    expect(res.headers.get('ETag')).toMatch(ASCII_QUOTED_ETAG)
  })

  it('rejects an oversized filter list instead of inflating the header', async () => {
    const many = Array.from({ length: 200 }, () => 'barbell').join(',')
    const res = await get(
      `/v1/programs?gender=male&available_equipment=${many}`,
    )
    expect(res.status).toBe(400)
  })
})
