export type * from './parse-json.types'

import { err, ok } from '../../result'
import type { Result } from '../../types/result/result.types'

/**
 * Parses a JSON string and returns a result indicating success or failure.
 *
 * @param input - The JSON string to parse. An empty string will result in a failure.
 * @returns A result object indicating success or failure. On success, the `value` property contains the parsed object. On failure, the `error` property contains the `SyntaxError`.
 * @throws If the input is not a valid JSON string and the error is not a `SyntaxError`, the function will rethrow the error.
 *
 * @example
 * ```ts
 * parseJson('{"key": "value"}') // { ok: true, value: { key: 'value' } }
 * parseJson('invalid json') // { ok: false, error: SyntaxError }
 * ```
 *
 * @category string
 */
export function parseJson<T = unknown>(input: string): Result<T, SyntaxError> {
  try {
    return ok(JSON.parse(input))
  } catch (error) {
    if (error instanceof SyntaxError) {
      return err(error as SyntaxError)
    }
    throw error
  }
}
