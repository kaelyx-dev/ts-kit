// Public types for from-query-string.
// Every exported name must start with "FromQueryString".

/**
 * The result of `fromQueryString`. A key that occurs once gives a string. A key that occurs two
 * or more times gives an array of strings.
 *
 * @category object
 */
export type FromQueryStringResult = Record<string, string | string[]>
