export type * from './to-query-string.types'
import {
  UNSAFE_KEYS,
  isPlainObject,
  joinKey,
  resolveQueryStringOptions,
} from '../../_internal/object/query-string/query-string'
import type { ToQueryStringOptions, ToQueryStringResolvedOptions } from './to-query-string.types'

/** Object keys, or array indexes inside a value that is written as JSON. */
type Path = readonly (string | number)[]

type Entry = [key: string, value: string]

type Leaf = string | number | boolean | null | Date

interface Context {
  options: ToQueryStringResolvedOptions
  /** The objects and arrays on the current path, to find circular references. */
  ancestors: WeakSet<object>
}

function resolveOptions(options?: ToQueryStringOptions): ToQueryStringResolvedOptions {
  const shared = resolveQueryStringOptions(options)

  if (options?.deep === false) {
    return {
      ...shared,
      serialiseOnDeepLimitExceeded: true,
      serialiseOnShallow: options.serialiseOnShallow ?? true,
      serialiseLimit: options.serialiseLimit ?? Number.POSITIVE_INFINITY,
    }
  }

  return {
    ...shared,
    serialiseOnDeepLimitExceeded: options?.serialiseOnDeepLimitExceeded ?? true,
    serialiseOnShallow: true,
    serialiseLimit: options?.serialiseLimit ?? Number.POSITIVE_INFINITY,
  }
}

function formatPath(path: Path, separator: string): string {
  return path
    .map((segment, i) => {
      if (typeof segment === 'number') return `[${segment}]`
      return i === 0 ? segment : `${separator}${segment}`
    })
    .join('')
}

function fail(path: Path, context: Context, reason: string): never {
  const at = formatPath(path, context.options.deepSeparator)
  throw new TypeError(`toQueryString: ${reason} at "${at}".`)
}

function describe(value: unknown): string {
  if (typeof value !== 'object' || value === null) return typeof value
  return value.constructor?.name ?? 'object'
}

/**
 * Examine a value at a key path and say how to write it. Throws a `TypeError` for each value
 * that cannot round-trip: non-finite numbers, invalid dates, and anything that is not a string,
 * number, boolean, null, date, array or plain object.
 */
function classify(
  value: unknown,
  path: Path,
  context: Context,
): 'omit' | 'leaf' | 'array' | 'object' {
  if (value === undefined) return 'omit'
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return 'leaf'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail(path, context, `${value} is not a finite number`)
    return 'leaf'
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) fail(path, context, 'the date is invalid')
    return 'leaf'
  }
  if (Array.isArray(value)) return 'array'
  if (isPlainObject(value)) return 'object'
  return fail(path, context, `a value of type ${describe(value)} is not supported`)
}

function checkKey(key: string, path: Path, context: Context): void {
  if (UNSAFE_KEYS.has(key)) fail(path, context, `the key "${key}" is not allowed`)
}

/** Run `visit` with `value` on the current path. Throws if `value` is already on it. */
function withAncestor<T>(value: object, path: Path, context: Context, visit: () => T): T {
  if (context.ancestors.has(value)) fail(path, context, 'the value has a circular reference')
  context.ancestors.add(value)
  try {
    return visit()
  } finally {
    context.ancestors.delete(value)
  }
}

/** Convert a value to the form that `JSON.stringify` writes without loss. */
function toJsonValue(value: unknown, path: Path, context: Context, depth: number): unknown {
  const kind = classify(value, path, context)
  if (kind === 'omit') return undefined
  if (kind === 'leaf') return value instanceof Date ? value.toISOString() : value

  if (depth >= context.options.serialiseLimit) {
    fail(
      path,
      context,
      `the value is deeper than serialiseLimit (${context.options.serialiseLimit})`,
    )
  }

  return withAncestor(value as object, path, context, () =>
    kind === 'array'
      ? arrayToJson(value as unknown[], path, context, depth + 1)
      : objectToJson(value as Record<string, unknown>, path, context, depth + 1),
  )
}

function arrayToJson(items: unknown[], path: Path, context: Context, depth: number): unknown[] {
  // entries() visits the holes of a sparse array, so they throw like undefined items.
  return [...items.entries()].map(([i, item]) => {
    if (item === undefined) fail([...path, i], context, 'an array item is undefined')
    return toJsonValue(item, [...path, i], context, depth)
  })
}

function objectToJson(
  object: Record<string, unknown>,
  path: Path,
  context: Context,
  depth: number,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(object)) {
    checkKey(key, [...path, key], context)
    const json = toJsonValue(value, [...path, key], context, depth)
    if (json !== undefined) result[key] = json
  }
  return result
}

function serialise(value: unknown, path: Path, context: Context): string {
  return JSON.stringify(toJsonValue(value, path, context, 0))
}

function leafToString(value: Leaf): string {
  if (value === null) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function encodeLeaf(value: Leaf, path: Path, context: Context): string {
  return context.options.mode === 'json' ? serialise(value, path, context) : leafToString(value)
}

function encodeArray(items: unknown[], key: string, path: Path, context: Context): Entry[] {
  if (context.options.arrayFormat === 'json') return [[key, serialise(items, path, context)]]

  return withAncestor(items, path, context, () =>
    [...items.entries()].map(([i, item]): Entry => {
      const itemPath = [...path, i]
      const kind = classify(item, itemPath, context)
      if (kind === 'omit') fail(itemPath, context, 'an array item is undefined')
      if (kind === 'leaf') return [key, encodeLeaf(item as Leaf, itemPath, context)]
      if (context.options.mode === 'json') return [key, serialise(item, itemPath, context)]
      return fail(
        itemPath,
        context,
        "an array in strings-only mode can hold only strings, numbers, booleans, null and dates. Use mode: 'json' for arrays that hold objects or arrays",
      )
    }),
  )
}

function encodeObject(
  object: Record<string, unknown>,
  key: string,
  path: string[],
  context: Context,
  depth: number,
): Entry[] {
  const { options } = context

  if (!options.deep) {
    return options.serialiseOnShallow ? [[key, serialise(object, path, context)]] : []
  }

  if (depth < options.deepLimit) {
    const entries = encodeEntries(object, path, context, depth + 1)
    // A key with no entries disappears. JSON mode can say "empty object", so it keeps the key.
    return entries.length === 0 && options.mode === 'json' ? [[key, '{}']] : entries
  }

  return options.serialiseOnDeepLimitExceeded ? [[key, serialise(object, path, context)]] : []
}

function encodeValue(value: unknown, path: string[], context: Context, depth: number): Entry[] {
  const key = joinKey(path, context.options.deepSeparator)

  switch (classify(value, path, context)) {
    case 'omit':
      return []
    case 'leaf':
      return [[key, encodeLeaf(value as Leaf, path, context)]]
    case 'array':
      return encodeArray(value as unknown[], key, path, context)
    case 'object':
      return encodeObject(value as Record<string, unknown>, key, path, context, depth)
  }
}

/** Flatten the entries of `object`, which is `depth` levels below the input. */
function encodeEntries(
  object: Record<string, unknown>,
  path: string[],
  context: Context,
  depth: number,
): Entry[] {
  const { deep, deepSeparator } = context.options

  return withAncestor(object, path, context, () =>
    Object.entries(object).flatMap(([key, value]) => {
      const childPath = [...path, key]
      checkKey(key, childPath, context)
      if (deep && key.includes(deepSeparator)) {
        fail(childPath, context, `the key contains the deepSeparator "${deepSeparator}"`)
      }
      return encodeValue(value, childPath, context, depth)
    }),
  )
}

/**
 * toQueryString, converts an object to a query string. The inverse of `fromQueryString`: with
 * the same options, `fromQueryString(toQueryString(value, options), options)` gives the value
 * back, within the limits that the
 * {@link https://kaelyx.dev/ts-kit/usage/query-strings | query string contract} states.
 *
 * In strings-only mode (the default), each value is written as text and arrays are written as
 * repeated keys. In JSON mode (`mode: 'json'`), each value is written as JSON, so its type
 * survives the round trip.
 *
 * If deep is true (the default), nested objects are flattened into keys joined with
 * `deepSeparator`. For example, `{ a: { b: 1 } }` becomes `"a.b=1"`. If deep is false, a nested
 * object is written as one JSON value.
 *
 * @param input - The plain object to convert. An empty object (`{}`) returns an empty string. `undefined` values are omitted. In strings-only mode, `null` values are written as an empty string, and dates as ISO strings.
 * @param options - Controls the mode, the array format, flattening depth and how (or whether) nested objects beyond that depth are JSON-serialised. See {@link ToQueryStringOptions}.
 * @returns A URL-encoded query string (without a leading `?`).
 * @throws {TypeError} If a value cannot round-trip: `NaN`, `Infinity`, a `BigInt`, a `Map`, a `Set`, a class instance, a function, a symbol, an invalid date, an `undefined` array item, or a circular reference. Also if a key is `__proto__`, `prototype` or `constructor`, if a key contains `deepSeparator` while `deep` is true, if a value written as JSON is deeper than `serialiseLimit`, or if an array holds an object or an array with `arrayFormat: 'repeat'` in strings-only mode. The message contains the key path.
 *
 * @example
 * ```ts
 * // Strings-only mode, the default. Arrays are repeated keys.
 * toQueryString({ a: 1, b: 'two' }) // "a=1&b=two"
 * toQueryString({ a: { b: 1 } }) // "a.b=1"
 * toQueryString({ tags: ['x', 'y'] }) // "tags=x&tags=y"
 * toQueryString({ tags: ['x', 'y'] }, { arrayFormat: 'json' }) // "tags=%5B%22x%22%2C%22y%22%5D"
 * toQueryString({ a: { b: 1 } }, { deep: false }) // "a=%7B%22b%22%3A1%7D"
 * toQueryString({ a: { b: { c: 1 } } }, { deepLimit: 1 }) // "a.b=%7B%22c%22%3A1%7D"
 *
 * // JSON mode. Each value is JSON, and arrays are one JSON value.
 * toQueryString({ name: 'Ada', age: 3 }, { mode: 'json' }) // "name=%22Ada%22&age=3"
 * toQueryString({ tags: ['x'] }, { mode: 'json' }) // "tags=%5B%22x%22%5D"
 * toQueryString({ tags: ['x', 'y'] }, { mode: 'json', arrayFormat: 'repeat' }) // "tags=%22x%22&tags=%22y%22"
 * ```
 *
 * @category object
 */
export function toQueryString(
  input: Record<string, unknown>,
  options?: ToQueryStringOptions,
): string {
  if (!isPlainObject(input)) {
    throw new TypeError('toQueryString: the input must be a plain object.')
  }

  const context: Context = { options: resolveOptions(options), ancestors: new WeakSet() }

  const params = new URLSearchParams()
  for (const [key, value] of encodeEntries(input, [], context, 0)) {
    params.append(key, value)
  }

  return params.toString()
}
