export type * from './unwrap.types'

import type { Result } from '../../types/result/result.types'

/**
 * Returns the value of a successful `Result`, or throws if the `Result` failed.
 * Use `unwrapOr` if you want a fallback value instead of an exception.
 *
 * @param result - The `Result` to unwrap.
 * @returns The value of the `Result` when `ok` is `true`.
 * @throws An `Error` when `ok` is `false`. The original error is attached as the `cause`.
 *
 * @example
 * ```ts
 * unwrap(ok(42)) // 42
 * unwrap(err('Something went wrong')) // throws Error('Attempted to unwrap an Err result')
 * ```
 *
 * @category result
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value
  }
  throw new Error('Attempted to unwrap an Err result', { cause: result.error })
}
