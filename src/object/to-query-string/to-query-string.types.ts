// Public types for to-query-string.
// Every exported name must start with "ToQueryString".

/**
 * A value that `toQueryString` can write. `undefined` is omitted, `null` is written as an empty
 * string, and a date as an ISO string.
 *
 * @category object
 */
export type ToQueryStringValue = string | number | boolean | Date | null | undefined

/**
 * The input of `toQueryString`: a flat object. An array value is written as repeated keys.
 *
 * @category object
 */
export type ToQueryStringInput = Record<string, ToQueryStringValue | readonly ToQueryStringValue[]>
