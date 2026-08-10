import { Hono } from 'hono'

import { logger } from './lib/logger'
import { applyCoreMiddleware } from './middleware'
import { routes } from './routes'
import type { AppEnv } from './types/app'

const app = new Hono<AppEnv>()

applyCoreMiddleware(app)

app.route('/', routes)

// Without this, an uncaught throw leaves Hono's default handler to answer with
// a plain-text "Internal Server Error" — no error envelope, no requestId.
app.onError((err, c) => {
  logger.error({
    event: 'unhandled_error',
    name: err instanceof Error ? err.name : 'Unknown',
    reason: err instanceof Error ? err.message : String(err),
    requestId: c.get('requestId'),
  })
  return c.json(
    {
      error: {
        code: 'internal_error',
        message: 'Internal Server Error',
      },
      requestId: c.get('requestId'),
    },
    500,
  )
})

app.notFound((c) => {
  return c.json(
    {
      error: {
        code: 'not_found',
        message: 'Not Found',
      },
      requestId: c.get('requestId'),
    },
    404,
  )
})

export default app
