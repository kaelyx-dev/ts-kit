export type * from './is-json.types'
import type { IsJsonParseResult } from './is-json.types'

/**
 * isJson checks if a string is valid JSON and returns the parsed data if it is.
 *
 * @param input - The string to check.
 * @returns An object indicating whether the string is valid JSON and the parsed data or error. Via the structure of IsJsonParseResult, if valid is true, data will contain the parsed JSON. If valid is false, error will contain the parsing error. This function does not throw an error for invalid JSON; instead, it returns an object with valid set to false and the error information.
 *
 * @example
 * ```ts
 * isJson('{"name": "John"}') // { valid: true, data: { name: "John" } }
 * isJson('not json') // { valid: false, error: SyntaxError }
 * ```
 *
 * @category string
 */
export function isJson<T = unknown>(input: string): IsJsonParseResult<T> {
  try {
    const data = JSON.parse(input) as T
    return { valid: true, data }
  } catch (error) {
    return { valid: false, error }
  }
}
