import { Hono } from 'hono'

import {
  getAllExercises,
  getEngineVersion,
  getExerciseById,
} from '../../lib/workout-engine'
import { requireSupabaseAuth } from '../../middleware/auth'
import type { AppEnv } from '../../types/app'
import {
  ExerciseResponseSchema,
  ExercisesListResponseSchema,
} from '../../types/workout-engine'

export const exercisesRoutes = new Hono<AppEnv>()

exercisesRoutes.use('/exercises', requireSupabaseAuth())
exercisesRoutes.use('/exercises/*', requireSupabaseAuth())

exercisesRoutes.get('/exercises', (c) => {
  const requestId = c.get('requestId')
  const engineVersion = getEngineVersion()
  const etag = `"exercises-${engineVersion}"`

  c.header('Cache-Control', 'private, max-age=3600')
  c.header('ETag', etag)
  if (c.req.header('If-None-Match') === etag) {
    return c.body(null, 304)
  }

  const body = ExercisesListResponseSchema.parse({
    engineVersion,
    exercises: getAllExercises(),
    requestId,
  })
  return c.json(body)
})

exercisesRoutes.get('/exercises/:id', (c) => {
  const requestId = c.get('requestId')
  const id = c.req.param('id')

  const engineVersion = getEngineVersion()
  const etag = `"exercise-${id}-${engineVersion}"`
  c.header('Cache-Control', 'private, max-age=3600')
  c.header('ETag', etag)

  const entry = getExerciseById(id)
  if (!entry) {
    return c.json(
      {
        error: { code: 'not_found', message: 'Exercise not found' },
        requestId,
      },
      404,
    )
  }

  if (c.req.header('If-None-Match') === etag) {
    return c.body(null, 304)
  }

  const body = ExerciseResponseSchema.parse({
    engineVersion,
    exercise: entry,
    requestId,
  })
  return c.json(body)
})
