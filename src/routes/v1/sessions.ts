import { Hono } from 'hono'

import { generateSession } from '../../lib/workout-engine'
import { requireSupabaseAuth } from '../../middleware/auth'
import type { AppEnv } from '../../types/app'
import {
  SessionInputSchema,
  WorkoutGenerationResponseSchema,
} from '../../types/workout-engine'

export const sessionsRoutes = new Hono<AppEnv>()

sessionsRoutes.use('/sessions/*', requireSupabaseAuth())

sessionsRoutes.post('/sessions/generate', async (c) => {
  const requestId = c.get('requestId')

  let rawBody: unknown
  try {
    rawBody = await c.req.json()
  } catch {
    return c.json(
      {
        error: { code: 'bad_request', message: 'Body must be valid JSON' },
        requestId,
      },
      400,
    )
  }

  const parsedInput = SessionInputSchema.safeParse(rawBody)
  if (!parsedInput.success) {
    return c.json(
      {
        error: {
          code: 'bad_request',
          issues: parsedInput.error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
          message: 'Invalid request body',
        },
        requestId,
      },
      400,
    )
  }

  let output
  try {
    output = generateSession(parsedInput.data)
  } catch (err) {
    console.log(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
        event: 'sessions.generate.engine_rejected',
        requestId,
      }),
    )
    return c.json(
      {
        error: {
          code: 'unprocessable_entity',
          message: 'The workout engine could not satisfy the request',
        },
        requestId,
      },
      422,
    )
  }

  const parsedOutput = WorkoutGenerationResponseSchema.safeParse({
    ...output,
    requestId,
  })
  if (!parsedOutput.success) {
    console.log(
      JSON.stringify({
        event: 'sessions.generate.engine_contract_violation',
        issues: parsedOutput.error.issues.map((i) => ({
          message: i.message,
          path: i.path,
        })),
        requestId,
      }),
    )
    return c.json(
      {
        error: {
          code: 'internal_error',
          message: 'Unexpected engine response',
        },
        requestId,
      },
      500,
    )
  }

  return c.json(parsedOutput.data)
})
