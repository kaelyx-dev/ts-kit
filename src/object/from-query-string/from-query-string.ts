export type * from './from-query-string.types'
import { isJson } from '../../string/is-json/is-json'
import type {
  FromQueryStringOptions,
  FromQueryStringResolvedOptions,
} from './from-query-string.types'

function resolveFromQueryStringOptions(
  options?: FromQueryStringOptions,
): FromQueryStringResolvedOptions {
  if (options?.deep === false) {
    return {
      deep: false,
      deepSeparator: '.',
      deepLimit: Number.POSITIVE_INFINITY,
      parseJson: options.parseJson ?? true,
      parsePrimitives: options.parsePrimitives ?? false,
    }
  }

  return {
    deep: true,
    deepSeparator: options?.deepSeparator ?? '.',
    deepLimit: options?.deepLimit ?? Number.POSITIVE_INFINITY,
    parseJson: options?.parseJson ?? true,
    parsePrimitives: options?.parsePrimitives ?? false,
  }
}

/**
 * Keys that would let an attacker reach into (or pollute) an object's
 * prototype via `input[key]` assignment during unflattening. Skipped
 * outright rather than assigned.
 */
const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

function parsePrimitiveString(value: string): unknown {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
  return value
}

function parseValue(raw: string, options: FromQueryStringResolvedOptions): unknown {
  if (options.parseJson) {
    const parsed = isJson(raw)
    if (parsed.valid) return parsed.data
  }

  if (options.parsePrimitives) {
    return parsePrimitiveString(raw)
  }

  return raw
}

/**
 * Assign `value` into `target` at the path described by `segments`,
 * creating intermediate plain objects as needed. Segments matching
 * `UNSAFE_KEYS` are dropped to prevent prototype pollution.
 */
function setAtPath(target: Record<string, unknown>, segments: string[], value: unknown): void {
  let cursor = target

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (segment === undefined) return
    if (UNSAFE_KEYS.has(segment)) return

    const isLast = i === segments.length - 1

    if (isLast) {
      cursor[segment] = value
      return
    }

    const existing = cursor[segment]
    if (typeof existing !== 'object' || existing === null || Array.isArray(existing)) {
      cursor[segment] = {}
    }
    cursor = cursor[segment] as Record<string, unknown>
  }
}

/**
 * Split a flattened key like `a.b.c` into `['a', 'b', 'c']`, honouring
 * `deepSeparator` and `deepLimit`. Once `deepLimit` splits have been made,
 * the remainder of the key (including any further separators) is kept as
 * a single trailing segment — mirroring `toQueryString`'s `deepLimit`
 * behaviour, where nesting stops but the leftover value is preserved whole.
 */
function splitKey(key: string, options: FromQueryStringResolvedOptions): string[] {
  if (!options.deep || !Number.isFinite(options.deepLimit)) {
    return key.split(options.deepSeparator)
  }

  const segments = key.split(options.deepSeparator)
  if (segments.length <= options.deepLimit + 1) return segments

  const head = segments.slice(0, options.deepLimit)
  const tail = segments.slice(options.deepLimit).join(options.deepSeparator)
  return [...head, tail]
}

/**
 * fromQueryString, converts a query string back into an object. The inverse
 * of `toQueryString` — use matching `deep`/`deepSeparator` options to
 * round-trip correctly.
 *
 * If deep is true (default), keys containing `deepSeparator` are split and
 * rebuilt into nested objects. For example, `"a.b=1"` becomes `{ a: { b: 1 } }`.
 *
 * If deep is false, each param becomes a single top-level key with no
 * splitting. For example, `"a=%7B%22b%22%3A1%7D"` becomes `{ a: '{"b":1}' }`
 * unless `parseJson` decodes it further (see below).
 *
 * Regardless of `deep`, if `parseJson` is true (default) any value that looks
 * like JSON is parsed into its real form — so a value serialised with
 * `toQueryString({ deep: false })` round-trips back into a nested object.
 *
 * @param input - The query string to parse. A leading `?` is stripped if present.
 *   An empty string returns `{}`.
 * @param options - Controls unflattening and value coercion. See {@link FromQueryStringOptions}.
 * @returns A plain object rebuilt from the query string.
 *
 * @example
 * ```ts
 * fromQueryString('a=1&b=two') // { a: '1', b: 'two' }
 * fromQueryString('a=1&b=two', { parsePrimitives: true }) // { a: 1, b: 'two' }
 * fromQueryString('a.b=1') // { a: { b: 1 } } -- parsePrimitives here only affects
 * //   values, not detecting numeric strings unless enabled; '1' stays '1' unless parsePrimitives is true
 * fromQueryString('a=%7B%22b%22%3A1%7D') // { a: { b: 1 } } via parseJson
 * fromQueryString('a=%7B%22b%22%3A1%7D', { parseJson: false }) // { a: '{"b":1}' }
 * ```
 *
 * @category object
 */
export function fromQueryString(
  input: string,
  options?: FromQueryStringOptions,
): Record<string, unknown> {
  const resolvedOptions = resolveFromQueryStringOptions(options)
  const query = input.startsWith('?') ? input.slice(1) : input

  const result: Record<string, unknown> = {}
  const params = new URLSearchParams(query)

  for (const [key, raw] of params) {
    const value = parseValue(raw, resolvedOptions)

    if (!resolvedOptions.deep) {
      if (!UNSAFE_KEYS.has(key)) result[key] = value
      continue
    }

    const segments = splitKey(key, resolvedOptions)
    setAtPath(result, segments, value)
  }

  return result
}
