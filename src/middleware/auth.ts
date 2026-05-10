import type { MiddlewareHandler } from 'hono'
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'

import type { AppEnv } from '../types/app'
import type { SupabaseJWTPayload } from '../types/auth'

const JWKS_CACHE_MAX_AGE_MS = 600_000
const JWKS_COOLDOWN_MS = 30_000

const jwksCache = new Map<string, JWTVerifyGetKey>()

const getJWKS = (projectUrl: string): JWTVerifyGetKey => {
  const cached = jwksCache.get(projectUrl)
  if (cached) {
    return cached
  }

  const jwks = createRemoteJWKSet(
    new URL(`${projectUrl}/auth/v1/.well-known/jwks.json`),
    {
      cacheMaxAge: JWKS_CACHE_MAX_AGE_MS,
      cooldownDuration: JWKS_COOLDOWN_MS,
    },
  )
  jwksCache.set(projectUrl, jwks)
  return jwks
}

export const requireSupabaseAuth = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    const requestId = c.get('requestId')
    const fail = () =>
      c.json(
        {
          error: {
            code: 'unauthorized',
            message: 'Authentication required',
          },
          requestId,
        },
        401,
      )

    const header = c.req.header('Authorization')
    if (!header || !header.startsWith('Bearer ')) {
      return fail()
    }

    const token = header.slice('Bearer '.length).trim()
    if (!token) {
      return fail()
    }

    const projectUrl = c.env.SUPABASE_PROJECT_URL
    if (!projectUrl) {
      return fail()
    }

    try {
      const jwks = getJWKS(projectUrl)
      const { payload } = await jwtVerify(token, jwks, {
        audience: 'authenticated',
        issuer: `${projectUrl}/auth/v1`,
      })

      if (typeof payload.sub !== 'string') {
        return fail()
      }

      const user = payload as SupabaseJWTPayload
      c.set('user', user)
      console.log(
        JSON.stringify({
          event: 'auth.success',
          requestId,
          userId: user.sub,
        }),
      )
      await next()
      return
    } catch {
      return fail()
    }
  }
}
