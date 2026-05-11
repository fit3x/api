import { Hono } from 'hono'

import type { AppEnv } from '../types/app'
import { v1Routes } from './v1'

export const routes = new Hono<AppEnv>()

routes.route('/v1', v1Routes)
