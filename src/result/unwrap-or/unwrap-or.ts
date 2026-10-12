export type * from './unwrap-or.types'

import type { Result } from '../../types/result/result.types'

/**
 * Returns the value of a successful `Result`, or the default value if the `Result` failed.
 *
 * @param result - The `Result` to unwrap.
 * @param defaultValue - The value to return when `ok` is `false`.
 * @returns The value of the `Result` when `ok` is `true`. Otherwise, `defaultValue`.
 *
 * @example
 * ```ts
 * unwrapOr(ok(42), 0) // 42
 * unwrapOr(err('Something went wrong'), 0) // 0
 * ```
 *
 * @category result
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.ok) {
    return result.value
  }
  return defaultValue
}
