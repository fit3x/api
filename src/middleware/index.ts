import type { Hono } from 'hono'

import type { AppEnv } from '../types/app'
import { mobileAppCors } from './cors'
import { structuredLogger } from './logging'
import { requestIdMiddleware } from './request-id'
import { securityHeaders } from './security'

export const applyCoreMiddleware = (app: Hono<AppEnv>): void => {
  app.use('*', requestIdMiddleware())
  app.use('*', structuredLogger())
  app.use('*', securityHeaders())
  app.use('*', mobileAppCors())
}
