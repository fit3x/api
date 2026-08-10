// Structured JSON logging. Workers ships stdout to the observability stream,
// so one JSON object per line is the transport.
//
// Nothing here may carry PII: log identifiers, codes and counts — never request
// bodies, tokens, or free-text a user typed.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogFields {
  readonly event: string
  readonly requestId?: string
  readonly [key: string]: unknown
}

const REDACTED = '[redacted]'

/** Keys whose values never reach the log, at any depth. */
const SENSITIVE_KEYS = new Set([
  'authorization',
  'access_token',
  'api_key',
  'apikey',
  'body',
  'cookie',
  'email',
  'id_token',
  'jwt',
  'password',
  'refresh_token',
  'secret',
  'token',
])

const redact = (value: unknown, depth = 0): unknown => {
  if (depth > 6) return REDACTED
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1))
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : redact(val, depth + 1),
      ]),
    )
  }
  return value
}

const write = (level: LogLevel, fields: LogFields): void => {
  const line = JSON.stringify({
    level,
    ...(redact(fields) as Record<string, unknown>),
  })
  if (level === 'error' || level === 'warn') {
    console.error(line)
    return
  }
  console.info(line)
}

export const logger = {
  debug: (fields: LogFields): void => write('debug', fields),
  info: (fields: LogFields): void => write('info', fields),
  warn: (fields: LogFields): void => write('warn', fields),
  error: (fields: LogFields): void => write('error', fields),
}
