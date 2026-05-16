import { Hono } from 'hono'

import { getEngineVersion, getProgramsCatalog } from '../../lib/workout-engine'
import { requireSupabaseAuth } from '../../middleware/auth'
import type { AppEnv } from '../../types/app'
import { WorkoutProgramsResponseSchema } from '../../types/workout-engine'

export const programsRoutes = new Hono<AppEnv>()

programsRoutes.use('/programs', requireSupabaseAuth())

programsRoutes.get('/programs', (c) => {
  const etag = `"programs-${getEngineVersion()}"`
  c.header('Cache-Control', 'public, max-age=3600')
  c.header('ETag', etag)

  if (c.req.header('If-None-Match') === etag) {
    return c.body(null, 304)
  }

  const body = WorkoutProgramsResponseSchema.parse({
    ...getProgramsCatalog(),
    requestId: c.get('requestId'),
  })
  return c.json(body)
})
