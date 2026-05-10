import type { JWTPayload } from 'jose'

export type SupabaseJWTPayload = JWTPayload & {
  sub: string
  aud: string
  role: string
  email?: string
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}
