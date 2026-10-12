export type * from './from-query-string.types'
import {
  UNSAFE_KEYS,
  resolveQueryStringOptions,
  splitKey,
} from '../../_internal/object/query-string/query-string'
import { parseJson } from '../../string/parse-json/parse-json'
import type {
  FromQueryStringOptions,
  FromQueryStringResolvedOptions,
} from './from-query-string.types'

function decodeValue(key: string, raw: string, options: FromQueryStringResolvedOptions): unknown {
  if (options.mode === 'string') return raw

  const parsed = parseJson(raw)
  if (parsed.ok) return parsed.value
  throw new SyntaxError(`fromQueryString: the value of "${key}" is not valid JSON.`, {
    cause: parsed.error,
  })
}

/**
 * Decode every value that the query string has for `key`. With `arrayFormat: 'repeat'`, two or
 * more values make an array. Otherwise the last value wins.
 */
function decodeValues(
  key: string,
  raws: string[],
  options: FromQueryStringResolvedOptions,
): unknown {
  if (options.arrayFormat === 'repeat' && raws.length > 1) {
    return raws.map((raw) => decodeValue(key, raw, options))
  }
  return decodeValue(key, raws[raws.length - 1] as string, options)
}

/**
 * Assign `value` into `target` at the path described by `segments`,
 * creating intermediate plain objects as needed. Segments matching
 * `UNSAFE_KEYS` are dropped to prevent prototype pollution.
 */
function setAtPath(target: Record<string, unknown>, segments: string[], value: unknown): void {
  let cursor = target

  const lastIndex = segments.length - 1

  for (const [i, segment] of segments.entries()) {
    if (UNSAFE_KEYS.has(segment)) return

    if (i === lastIndex) {
      cursor[segment] = value
    } else {
      const existing = cursor[segment]
      if (typeof existing !== 'object' || existing === null || Array.isArray(existing)) {
        cursor[segment] = {}
      }
      cursor = cursor[segment] as Record<string, unknown>
    }
  }
}

/**
 * fromQueryString, converts a query string back into an object. The inverse of
 * `toQueryString`: with the same options, `fromQueryString(toQueryString(value, options), options)`
 * gives the value back, within the limits that the
 * {@link https://kaelyx.dev/ts-kit/guide/query-strings | query string contract} states.
 *
 * In strings-only mode (the default), each value is returned as a string. The function does not
 * guess a type, so `"count=42"` gives `{ count: '42' }`. In JSON mode (`mode: 'json'`), each
 * value is parsed as JSON.
 *
 * With `arrayFormat: 'repeat'` (the default in strings-only mode), two or more equal keys give
 * an array, and one key gives one value. With `arrayFormat: 'json'`, the last value of a key wins.
 *
 * If deep is true (default), keys containing `deepSeparator` are split and rebuilt into nested
 * objects. For example, `"a.b=1"` becomes `{ a: { b: '1' } }`. If deep is false, each param
 * becomes a single top-level key with no splitting.
 *
 * The keys `__proto__`, `prototype` and `constructor` are dropped.
 *
 * @param input - The query string to parse. A leading `?` is stripped if present.
 *   An empty string returns `{}`.
 * @param options - Controls the mode, the array format and unflattening. See {@link FromQueryStringOptions}.
 * @returns A plain object rebuilt from the query string.
 * @throws {SyntaxError} In JSON mode, if a value is not valid JSON. The message contains the key, and `cause` is the error from `JSON.parse`.
 *
 * @example
 * ```ts
 * // Strings-only mode, the default. Repeated keys are arrays.
 * fromQueryString('a=1&b=two') // { a: '1', b: 'two' }
 * fromQueryString('a.b=1') // { a: { b: '1' } }
 * fromQueryString('tags=x&tags=y') // { tags: ['x', 'y'] }
 * fromQueryString('tags=%5B%22x%22%5D', { arrayFormat: 'json' }) // { tags: '["x"]' }
 *
 * // JSON mode. Each value is parsed as JSON.
 * fromQueryString('name=%22Ada%22&age=3', { mode: 'json' }) // { name: 'Ada', age: 3 }
 * fromQueryString('tags=%5B%22x%22%5D', { mode: 'json' }) // { tags: ['x'] }
 * fromQueryString('tags=%22x%22&tags=%22y%22', { mode: 'json', arrayFormat: 'repeat' }) // { tags: ['x', 'y'] }
 * ```
 *
 * @category object
 */
export function fromQueryString(
  input: string,
  options?: FromQueryStringOptions,
): Record<string, unknown> {
  const resolvedOptions = resolveQueryStringOptions(options)
  const query = input.startsWith('?') ? input.slice(1) : input

  const result: Record<string, unknown> = {}
  const params = new URLSearchParams(query)

  for (const key of new Set(params.keys())) {
    const value = decodeValues(key, params.getAll(key), resolvedOptions)
    setAtPath(result, splitKey(key, resolvedOptions), value)
  }

  return result
}
