import { Hono } from 'hono'

import type { AppEnv } from '../../types/app'
import { healthRoutes } from './health'
import { meRoutes } from './me'

export const v1Routes = new Hono<AppEnv>()

v1Routes.route('/', healthRoutes)
v1Routes.route('/', meRoutes)
