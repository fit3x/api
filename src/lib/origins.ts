const DEFAULT_MOBILE_APP_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19006',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:19006',
]

export const getAllowedOrigins = (configuredOrigins?: string): string[] => {
  const origins = configuredOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return origins?.length ? origins : DEFAULT_MOBILE_APP_ORIGINS
}

export const isAllowedOrigin = (origin: string, allowedOrigins: string[]): boolean => {
  return allowedOrigins.includes(origin)
}
