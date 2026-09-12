export type * from './to-query-string.types'
import type {
  ToQueryStringOptions,
  ToQueryStringOptionsResolvedOptions,
} from './to-query-string.types'

function resolveOptions(options?: ToQueryStringOptions): ToQueryStringOptionsResolvedOptions {
  if (options?.deep === false) {
    return {
      deep: false,
      deepSeparator: '.',
      deepLimit: Number.POSITIVE_INFINITY,
      serialiseOnDeepLimitExceeded: true,
      serialiseOnShallow: options.serialiseOnShallow ?? true,
      serialiseLimit: options.serialiseLimit ?? 2,
    }
  }

  return {
    deep: true,
    deepSeparator: options?.deepSeparator ?? '.',
    deepLimit: options?.deepLimit ?? Number.POSITIVE_INFINITY,
    serialiseOnDeepLimitExceeded: options?.serialiseOnDeepLimitExceeded ?? true,
    serialiseOnShallow: true,
    serialiseLimit: options?.serialiseLimit ?? 2,
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
  )
}

function stringifyWithLimit(value: unknown, limit: number): string {
  if (!Number.isFinite(limit)) {
    return JSON.stringify(value)
  }

  const seen = new WeakSet<object>()

  function truncate(val: unknown, depth: number): unknown {
    if (isPlainObject(val)) {
      if (depth >= limit) return '[Object]'
      if (seen.has(val)) return '[Circular]'
      seen.add(val)

      const result: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(val)) {
        result[k] = truncate(v, depth + 1)
      }
      return result
    }

    if (Array.isArray(val)) {
      if (depth >= limit) return '[Array]'
      return val.map((v) => truncate(v, depth + 1))
    }

    return val
  }

  return JSON.stringify(truncate(value, 0))
}

function stringifyPrimitive(value: unknown): string {
  if (value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function getFullKey(prefix: string, key: string, separator: string): string {
  return prefix ? `${prefix}${separator}${key}` : key
}

function flattenObjectEntry(
  key: string,
  value: Record<string, unknown>,
  options: ToQueryStringOptionsResolvedOptions,
  depth: number,
): [string, string][] {
  if (!options.deep) {
    return options.serialiseOnShallow
      ? [[key, stringifyWithLimit(value, options.serialiseLimit)]]
      : []
  }

  if (depth < options.deepLimit) {
    return flattenEntries(value, options, key, depth + 1)
  }

  return options.serialiseOnDeepLimitExceeded
    ? [[key, stringifyWithLimit(value, options.serialiseLimit)]]
    : []
}

function flattenEntry(
  key: string,
  value: unknown,
  options: ToQueryStringOptionsResolvedOptions,
  depth: number,
): [string, string][] {
  return isPlainObject(value)
    ? flattenObjectEntry(key, value, options, depth)
    : [[key, stringifyPrimitive(value)]]
}

function flattenEntries(
  input: Record<string, unknown>,
  options: ToQueryStringOptionsResolvedOptions,
  prefix = '',
  depth = 0,
): [string, string][] {
  const entries: [string, string][] = []

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue

    const fullKey = getFullKey(prefix, key, options.deepSeparator)
    entries.push(...flattenEntry(fullKey, value, options, depth))
  }

  return entries
}

/**
 * toQueryString, converts an object to a query string.
 * Objects with nested objects are not supported. Use `toQueryStringDeep` for that.
 *
 * If deep is set to true, the function will convert nested objects to query strings using the deepSeperator. For example, { a: { b: 1 } } will be converted to "a.b=1" if deep is true and deepSeparator is ".".
 *
 * If deep is set to false, the function will instead serialize the nested object as a JSON string and return it as a single query parameter. For example, { a: { b: 1 } } will be converted to "a=%7B%22b%22%3A1%7D" if deep is false.
 *
 * @param input - The object to convert. An empty object (`{}`) returns an empty string. `undefined` values are omitted; `null` values are included as an empty string.
 * @param options - Controls flattening depth and how (or whether) nested objects beyond that depth are JSON-serialised. See {@link ToQueryStringOptions}.
 * @returns A URL-encoded query string (without a leading `?`).
 *
 * @example
 * ```ts
 * toQueryString({ a: 1, b: 'two' }) // "a=1&b=two"
 * toQueryString({ a: { b: 1 } }) // "a.b=1"
 * toQueryString({ a: { b: 1 } }, { deep: false }) // "a=%7B%22b%22%3A1%7D"
 * toQueryString({ a: { b: { c: 1 } } }, { deepLimit: 1 }) // "a.b=%7B%22c%22%3A1%7D"
 * ```
 *
 * @category object
 */
export function toQueryString(
  input: Record<string, unknown>,
  options?: ToQueryStringOptions,
): string {
  const resolvedOptions = resolveOptions(options)

  const params = new URLSearchParams()
  for (const [key, value] of flattenEntries(input, resolvedOptions)) {
    params.append(key, value)
  }

  return params.toString()
}
