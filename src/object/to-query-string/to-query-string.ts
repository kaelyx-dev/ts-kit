export type * from './to-query-string.types'
import type { ToQueryStringInput, ToQueryStringValue } from './to-query-string.types'

function toText(value: Exclude<ToQueryStringValue, undefined>): string {
  if (value === null) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

/**
 * toQueryString, converts a flat object to a URL-encoded query string with `URLSearchParams`.
 *
 * An array is written as repeated keys, which most servers read as a list. `undefined` values
 * and `undefined` array items are omitted. `null` is written as an empty string, and a date as
 * an ISO string. Other values are written with `String`.
 *
 * Nested objects are not supported. To put one in a query string, write it with
 * `JSON.stringify` first.
 *
 * @param input - The flat object to convert. An empty object (`{}`) returns an empty string.
 * @returns A URL-encoded query string (without a leading `?`).
 * @throws {RangeError} If a date is not valid.
 *
 * @example
 * ```ts
 * toQueryString({ q: 'red shoes', page: 2 }) // "q=red+shoes&page=2"
 * toQueryString({ tags: ['new', 'sale'] }) // "tags=new&tags=sale"
 * toQueryString({ a: null, b: undefined }) // "a="
 * toQueryString({ at: new Date(0) }) // "at=1970-01-01T00%3A00%3A00.000Z"
 * ```
 *
 * @category object
 */
export function toQueryString(input: ToQueryStringInput): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(input)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) params.append(key, toText(item))
    }
  }
  return params.toString()
}
