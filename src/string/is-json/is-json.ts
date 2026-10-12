export type * from './is-json.types'
import { parseJson } from '../parse-json/parse-json'

/**
 * isJson checks if a string is valid JSON and returns a boolean result.
 * use `parseJson` internally to determine if the string is valid JSON.
 * use `parseJson` if you want the parsed result instead of just a boolean.
 *
 * @param input - The string to check.
 * @returns A boolean indicating whether the string is valid JSON.
 *
 * @example
 * ```ts
 * isJson('{"name": "John"}') // true
 * isJson('not json') // false
 * ```
 *
 * @category string
 */
export function isJson(input: string): boolean {
  return parseJson(input).ok
}
