import { Hono } from 'hono'

import { getOptionsBundle } from '../../lib/workout-engine'
import { requireSupabaseAuth } from '../../middleware/auth'
import type { AppEnv } from '../../types/app'
import {
  LocaleQuerySchema,
  OptionsBundleResponseSchema,
} from '../../types/workout-engine'

export const optionsRoutes = new Hono<AppEnv>()

optionsRoutes.use('/options', requireSupabaseAuth())

optionsRoutes.get('/options', (c) => {
  const requestId = c.get('requestId')
  const parsed = LocaleQuerySchema.safeParse({
    locale: c.req.query('locale'),
  })
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: 'bad_request',
          message: 'Invalid locale',
        },
        requestId,
      },
      400,
    )
  }
  const body = OptionsBundleResponseSchema.parse({
    ...getOptionsBundle(parsed.data.locale),
    requestId,
  })
  return c.json(body)
})
