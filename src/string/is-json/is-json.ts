export type * from './is-json.types'
import type { JsonParseResult } from './is-json.types'

/**
 * One sentence that says what the function does.
 *
 * @param input - The data. Say what an empty value does.
 * @returns Say what comes back.
 * @throws If the function throws, say when. Delete this line if it does not.
 *
 * @example
 * ```ts
 * isJson() // result
 * ```
 *
 * @category string
 */
export function isJson<T = unknown>(input: string): JsonParseResult<T> {
  try {
    const data = JSON.parse(input) as T
    return { valid: true, data }
  } catch (error) {
    return { valid: false, error }
  }
}
