import { Hono } from 'hono'

import { requireSupabaseAuth } from '../../middleware/auth'
import type { AppEnv } from '../../types/app'

export const meRoutes = new Hono<AppEnv>()

meRoutes.use('/me', requireSupabaseAuth())

meRoutes.get('/me', (c) => {
  const user = c.get('user')
  return c.json({
    email: user.email ?? null,
    id: user.sub,
    requestId: c.get('requestId'),
    role: user.role,
  })
})
