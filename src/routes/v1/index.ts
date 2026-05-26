import { Hono } from 'hono'

import type { AppEnv } from '../../types/app'
import { engineRoutes } from './engine'
import { exercisesRoutes } from './exercises'
import { healthRoutes } from './health'
import { meRoutes } from './me'
import { optionsRoutes } from './options'
import { programsRoutes } from './programs'
import { sessionsRoutes } from './sessions'

export const v1Routes = new Hono<AppEnv>()

v1Routes.route('/', engineRoutes)
v1Routes.route('/', exercisesRoutes)
v1Routes.route('/', healthRoutes)
v1Routes.route('/', meRoutes)
v1Routes.route('/', optionsRoutes)
v1Routes.route('/', programsRoutes)
v1Routes.route('/', sessionsRoutes)
