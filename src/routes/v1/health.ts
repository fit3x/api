import { Hono } from 'hono'

import type { AppEnv } from '../../types/app'

export const healthRoutes = new Hono<AppEnv>()

healthRoutes.get('/health', (c) => {
  return c.json({
    requestId: c.get('requestId'),
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: 'v1',
  })
})
