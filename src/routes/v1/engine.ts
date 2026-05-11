import { Hono } from 'hono'

import { getEngineVersion } from '../../lib/workout-engine'
import { requireSupabaseAuth } from '../../middleware/auth'
import type { AppEnv } from '../../types/app'
import { EngineVersionResponseSchema } from '../../types/workout-engine'

export const engineRoutes = new Hono<AppEnv>()

engineRoutes.use('/engine/*', requireSupabaseAuth())

engineRoutes.get('/engine/version', (c) => {
  const body = EngineVersionResponseSchema.parse({
    apiVersion: 'v1',
    engineVersion: getEngineVersion(),
    requestId: c.get('requestId'),
  })
  return c.json(body)
})
