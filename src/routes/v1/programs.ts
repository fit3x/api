import { Hono } from 'hono'

import { getProgramsCatalog } from '../../lib/workout-engine'
import { requireSupabaseAuth } from '../../middleware/auth'
import type { AppEnv } from '../../types/app'
import { WorkoutProgramsResponseSchema } from '../../types/workout-engine'

export const programsRoutes = new Hono<AppEnv>()

programsRoutes.use('/programs', requireSupabaseAuth())

programsRoutes.get('/programs', (c) => {
  const body = WorkoutProgramsResponseSchema.parse({
    ...getProgramsCatalog(),
    requestId: c.get('requestId'),
  })
  return c.json(body)
})
