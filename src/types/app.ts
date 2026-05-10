import type { RequestIdVariables } from 'hono/request-id'

import type { SupabaseJWTPayload } from './auth'

export type Bindings = {
  MOBILE_APP_ORIGINS?: string
  SUPABASE_PROJECT_URL: string
}

export type Variables = RequestIdVariables & {
  user: SupabaseJWTPayload
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
