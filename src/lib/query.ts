/**
 * Flatten a query string into a Zod-parsable record.
 *
 * `Object.fromEntries(searchParams)` silently keeps only the last value of a
 * repeated key, so `?goals=a&goals=b` would drop `a`. Repeated keys collapse
 * to an array here; single keys stay scalars, so scalar and list schemas both
 * parse from the same shape.
 */
export const searchParamsToRecord = (
  params: URLSearchParams,
): Record<string, string | string[]> => {
  const record: Record<string, string | string[]> = {}
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key)
    record[key] = values.length > 1 ? values : values[0]!
  }
  return record
}

/**
 * Serialize parsed filters into an ETag-safe fragment.
 *
 * A raw `JSON.stringify` embeds `"` characters, which would terminate the
 * quoted ETag early and emit a malformed `ETag` header. Percent-encoding keeps
 * it a single valid quoted-string token while staying 1:1 with the filter set,
 * so distinct filters can never collide on one ETag.
 */
export const etagFragment = (value: unknown): string =>
  encodeURIComponent(JSON.stringify(value ?? null))
