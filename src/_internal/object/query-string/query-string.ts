import type {
  QueryStringDeepOptions,
  QueryStringResolvedOptions,
  QueryStringShallowOptions,
} from './query-string.types'

/**
 * Keys that would let an attacker reach into (or pollute) an object's prototype via
 * `target[key]` assignment. `fromQueryString` drops them and `toQueryString` rejects them, so
 * neither direction loses data the other one kept.
 */
export const UNSAFE_KEYS: ReadonlySet<string> = new Set(['__proto__', 'prototype', 'constructor'])

/** True for `{}` literals and `Object.create(null)`, not for arrays, dates or class instances. */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** Resolve the options that both functions share, with the defaults from the contract. */
export function resolveQueryStringOptions(
  options?: QueryStringShallowOptions | QueryStringDeepOptions,
): QueryStringResolvedOptions {
  const mode = options?.mode ?? 'string'
  const arrayFormat = options?.arrayFormat ?? (mode === 'json' ? 'json' : 'repeat')

  if (options?.deep === false) {
    return {
      mode,
      arrayFormat,
      deep: false,
      deepSeparator: '.',
      deepLimit: Number.POSITIVE_INFINITY,
    }
  }

  const deepSeparator = options?.deepSeparator ?? '.'
  if (deepSeparator === '') {
    throw new TypeError('The deepSeparator option must not be an empty string.')
  }

  return {
    mode,
    arrayFormat,
    deep: true,
    deepSeparator,
    deepLimit: options?.deepLimit ?? Number.POSITIVE_INFINITY,
  }
}

/** Join the segments of a flattened key, for example `['a', 'b']` into `a.b`. */
export function joinKey(segments: readonly string[], separator: string): string {
  return segments.join(separator)
}

/**
 * Split a flattened key like `a.b.c` into `['a', 'b', 'c']`, honouring `deepSeparator` and
 * `deepLimit`. Once `deepLimit` splits have been made, the remainder of the key (including any
 * further separators) is kept as a single trailing segment — mirroring `toQueryString`'s
 * `deepLimit` behaviour, where nesting stops but the leftover value is preserved whole. When
 * `deep` is false, the key is one segment.
 */
export function splitKey(key: string, options: QueryStringResolvedOptions): string[] {
  if (!options.deep) return [key]

  const segments = key.split(options.deepSeparator)
  if (segments.length <= options.deepLimit + 1) return segments

  const head = segments.slice(0, options.deepLimit)
  const tail = segments.slice(options.deepLimit).join(options.deepSeparator)
  return [...head, tail]
}
