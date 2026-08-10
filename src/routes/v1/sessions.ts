import { Hono } from 'hono'

import { logger } from '../../lib/logger'
import { etagFragment, searchParamsToRecord } from '../../lib/query'
import {
  generateSession,
  getEngineVersion,
  getSessionCoverageMap,
  getSessionsCatalog,
  programExists,
  unknownMuscleIds,
} from '../../lib/workout-engine'
import { requireSupabaseAuth } from '../../middleware/auth'
import type { AppEnv } from '../../types/app'
import {
  findRemovedV2Fields,
  SessionCatalogResponseSchema,
  SessionCoverageResponseSchema,
  SessionInputSchema,
  SessionsQuerySchema,
  WorkoutGenerationResponseSchema,
} from '../../types/workout-engine'

export const sessionsRoutes = new Hono<AppEnv>()

sessionsRoutes.use('/sessions', requireSupabaseAuth())
sessionsRoutes.use('/sessions/*', requireSupabaseAuth())

/** Browse the standalone session catalog — the pool `single_session` picks
 *  from. Lets a client pick `constraints.body_parts` that actually resolve. */
sessionsRoutes.get('/sessions/catalog', (c) => {
  const requestId = c.get('requestId')

  const parsed = SessionsQuerySchema.safeParse(
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

  // Every other filter is a closed enum the schema already checked; muscle ids
  // are catalog data, so they are checked against the engine's live set. The
  // engine throws on an unknown id, which would otherwise be a 500.
  const unknownMuscles = unknownMuscleIds(filters.focus_muscles ?? [])
  if (unknownMuscles.length > 0) {
    return c.json(
      {
        error: {
          code: 'bad_request',
          issues: unknownMuscles.map((id) => ({
            message: `Unknown muscle id "${id}" — see muscles[] in GET /v1/options`,
            path: ['focus_muscles'],
          })),
          message: 'Invalid query parameters',
        },
        requestId,
      },
      400,
    )
  }

  const etag = `"sessions-${getEngineVersion()}-${locale}-${etagFragment(filters)}"`
  c.header('Cache-Control', 'private, max-age=3600')
  c.header('ETag', etag)
  if (c.req.header('If-None-Match') === etag) {
    return c.body(null, 304)
  }

  let catalog
  try {
    catalog = getSessionsCatalog(locale, filters)
  } catch (err) {
    // Defence in depth: the engine rejects filter values it does not know, and
    // a rejected filter is the client's input, not a server fault.
    logger.warn({
      event: 'sessions.catalog.engine_rejected_filters',
      reason: err instanceof Error ? err.message : String(err),
      requestId,
    })
    return c.json(
      {
        error: {
          code: 'bad_request',
          message: 'One or more filter values are not recognised',
        },
        requestId,
      },
      400,
    )
  }

  const body = SessionCatalogResponseSchema.parse({ ...catalog, requestId })
  return c.json(body)
})

/** Body-part coverage of the standalone session catalog. `eligible: 0` means
 *  a `single_session` request for that combination would fail. */
sessionsRoutes.get('/sessions/coverage', (c) => {
  const requestId = c.get('requestId')

  const etag = `"session-coverage-${getEngineVersion()}"`
  c.header('Cache-Control', 'private, max-age=3600')
  c.header('ETag', etag)
  if (c.req.header('If-None-Match') === etag) {
    return c.body(null, 304)
  }

  const body = SessionCoverageResponseSchema.parse({
    ...getSessionCoverageMap(),
    requestId,
  })
  return c.json(body)
})

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

  // Stale v2 payloads get a targeted message rather than a wall of
  // "unrecognized key" issues from the strict schemas below.
  const removed = findRemovedV2Fields(rawBody)
  if (removed.length > 0) {
    return c.json(
      {
        error: {
          code: 'unsupported_contract_version',
          issues: removed.map((r) => ({ message: r.message, path: r.path })),
          message:
            'Request uses fields removed in input contract v3. Update the client payload.',
        },
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
            message: i.message,
            path: i.path,
          })),
          message: 'Invalid request body',
        },
        requestId,
      },
      400,
    )
  }

  // A pinned program that does not resolve is a hard engine error. Resolving it
  // here makes it a 404 that names the field instead of an opaque 422.
  const programId = parsedInput.data.generation_request.program_id
  if (programId != null && !programExists(programId)) {
    return c.json(
      {
        error: {
          code: 'program_not_found',
          message:
            'generation_request.program_id does not match any program. Use an id from GET /v1/programs.',
        },
        requestId,
      },
      404,
    )
  }

  let output
  try {
    output = generateSession(parsedInput.data)
  } catch (err) {
    // The engine's message can name catalog internals, so it is logged rather
    // than returned.
    logger.warn({
      event: 'sessions.generate.engine_rejected',
      reason: err instanceof Error ? err.message : String(err),
      requestId,
      scope: parsedInput.data.generation_request.scope,
    })
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
    logger.error({
      event: 'sessions.generate.engine_contract_violation',
      engineVersion: getEngineVersion(),
      issues: parsedOutput.error.issues.slice(0, 20).map((i) => ({
        message: i.message,
        path: i.path,
      })),
      requestId,
    })
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
