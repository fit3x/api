import { Hono } from 'hono'

import { etagFragment, searchParamsToRecord } from '../../lib/query'
import { getEngineVersion, getProgramsCatalog } from '../../lib/workout-engine'
import { requireSupabaseAuth } from '../../middleware/auth'
import type { AppEnv } from '../../types/app'
import {
  ProgramsQuerySchema,
  WorkoutProgramsResponseSchema,
} from '../../types/workout-engine'

export const programsRoutes = new Hono<AppEnv>()

programsRoutes.use('/programs', requireSupabaseAuth())

/** The template-program catalog. `programs[].id` is what a client sends back as
 *  `generation_request.program_id` to pin a program. */
programsRoutes.get('/programs', (c) => {
  const requestId = c.get('requestId')

  const parsed = ProgramsQuerySchema.safeParse(
    searchParamsToRecord(new URL(c.req.url).searchParams),
  )
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: 'bad_request',
          issues: parsed.error.issues.map((i) => ({
            message: i.message,
            path: i.path,
          })),
          message: 'Invalid query parameters',
        },
        requestId,
      },
      400,
    )
  }

  const { locale, ...filters } = parsed.data
  const etag = `"programs-${getEngineVersion()}-${locale}-${etagFragment(filters)}"`
  c.header('Cache-Control', 'private, max-age=3600')
  c.header('ETag', etag)
  if (c.req.header('If-None-Match') === etag) {
    return c.body(null, 304)
  }

  const body = WorkoutProgramsResponseSchema.parse({
    ...getProgramsCatalog(locale, filters),
    requestId,
  })
  return c.json(body)
})
