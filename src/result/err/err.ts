export type * from './err.types'

import type { Result } from '../../types/result/result.types'

/**
 * Creates a failed `Result` that holds the given error.
 *
 * @param error - The error to hold. Falsy values such as `undefined`, `''` or `0` are kept as they are.
 * @returns A `Result` with `ok: false` and the error in the `error` property.
 *
 * @example
 * ```ts
 * err('Something went wrong') // { ok: false, error: 'Something went wrong' }
 * err(new Error('Boom')) // { ok: false, error: Error('Boom') }
 * ```
 *
 * @category result
 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}
