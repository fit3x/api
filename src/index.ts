import { Hono } from 'hono'

import { applyCoreMiddleware } from './middleware'
import { routes } from './routes'
import type { AppEnv } from './types/app'

const app = new Hono<AppEnv>()

applyCoreMiddleware(app)

app.route('/', routes)

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
