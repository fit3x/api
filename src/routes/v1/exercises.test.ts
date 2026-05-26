import { Hono } from 'hono'
import { exportJWK, generateKeyPair, type JWK, SignJWT } from 'jose'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { applyCoreMiddleware } from '../../middleware'
import type { AppEnv, Bindings } from '../../types/app'
import { exercisesRoutes } from './exercises'

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
  app.route('/v1', exercisesRoutes)
  return app
}

const callExercises = (
  path = '/v1/exercises',
  init: RequestInit = {},
): Promise<Response> => {
  const app = buildApp()
  const env: Bindings = { SUPABASE_PROJECT_URL: PROJECT_URL }
  return app.request(path, init, env)
}

describe('GET /v1/exercises', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await callExercises()
    expect(res.status).toBe(401)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('unauthorized')
  })

  it('returns 200 with a non-empty catalog and supports 304 round-trip', async () => {
    const token = await mintToken()
    const res = await callExercises('/v1/exercises', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const etag = res.headers.get('etag')
    expect(etag).toBeTruthy()

    const body = (await res.json()) as {
      engineVersion: string
      exercises: Array<{ id: string; name: string; type: string }>
      requestId: string
    }
    expect(typeof body.engineVersion).toBe('string')
    expect(body.engineVersion.length).toBeGreaterThan(0)
    expect(Array.isArray(body.exercises)).toBe(true)
    expect(body.exercises.length).toBeGreaterThan(0)
    expect(typeof body.exercises[0].id).toBe('string')
    expect(typeof body.exercises[0].name).toBe('string')
    expect(typeof body.requestId).toBe('string')

    const cached = await callExercises('/v1/exercises', {
      headers: {
        Authorization: `Bearer ${token}`,
        'If-None-Match': etag as string,
      },
    })
    expect(cached.status).toBe(304)
  })
})

describe('GET /v1/exercises/:id', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await callExercises('/v1/exercises/some-id')
    expect(res.status).toBe(401)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('unauthorized')
  })

  it('returns 404 for an unknown id', async () => {
    const token = await mintToken()
    const res = await callExercises('/v1/exercises/__does-not-exist__', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(404)
    const body = (await res.json()) as {
      error?: { code?: string; message?: string }
      requestId?: string
    }
    expect(body.error?.code).toBe('not_found')
    expect(body.error?.message).toBe('Exercise not found')
    expect(typeof body.requestId).toBe('string')
    expect((body.requestId ?? '').length).toBeGreaterThan(0)
  })

  it('returns 200 for a known id and supports 304 round-trip', async () => {
    const token = await mintToken()
    const listRes = await callExercises('/v1/exercises', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const list = (await listRes.json()) as {
      exercises: Array<{ id: string }>
    }
    const id = list.exercises[0].id

    const res = await callExercises(`/v1/exercises/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const etag = res.headers.get('etag')
    expect(etag).toBeTruthy()

    const body = (await res.json()) as {
      engineVersion: string
      exercise: { id: string; name: string }
      requestId: string
    }
    expect(body.exercise.id).toBe(id)
    expect(typeof body.exercise.name).toBe('string')

    const cached = await callExercises(`/v1/exercises/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'If-None-Match': etag as string,
      },
    })
    expect(cached.status).toBe(304)
  })
})
