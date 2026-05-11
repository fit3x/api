import type { MiddlewareHandler } from 'hono'

import type { AppEnv } from '../types/app'

type RequestLog = {
  durationMs: number
  method: string
  path: string
  requestId: string
  status: number
}

const getPath = (url: string): string => new URL(url).pathname

export const structuredLogger = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    const startedAt = Date.now()

    try {
      await next()
    } catch (error) {
      const log = {
        durationMs: Date.now() - startedAt,
        error:
          error instanceof Error
            ? { message: error.message, name: error.name }
            : { message: 'Unknown error' },
        method: c.req.method,
        path: getPath(c.req.url),
        requestId: c.get('requestId'),
        status: 500,
      }

      console.error(JSON.stringify(log))
      throw error
    }

    const log: RequestLog = {
      durationMs: Date.now() - startedAt,
      method: c.req.method,
      path: getPath(c.req.url),
      requestId: c.get('requestId'),
      status: c.res.status,
    }

    const message = JSON.stringify(log)
    if (c.res.status >= 500) {
      console.error(message)
    } else {
      console.log(message)
    }
  }
}
