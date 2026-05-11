import { cors } from 'hono/cors'

import { getAllowedOrigins, isAllowedOrigin } from '../lib/origins'

export const mobileAppCors = () => {
  return cors({
    origin: (origin, c) => {
      if (!origin) {
        return null
      }

      const allowedOrigins = getAllowedOrigins(c.env.MOBILE_APP_ORIGINS)
      return isAllowedOrigin(origin, allowedOrigins) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
    exposeHeaders: ['X-Request-Id'],
    maxAge: 600,
  })
}
