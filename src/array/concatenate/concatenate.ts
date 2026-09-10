import type { ConcatenateOptions } from './concatenate.types'

export type * from './concatenate.types'

/**
 * Joins two arrays into one new array.
 *
 * @param first - The first array. The function does not change it.
 * @param second - The second array. The function does not change it.
 * @param options - Optional. See {@link ConcatenateOptions}.
 * @returns A new array with the items of `first`, then the items of `second`.
 *
 * @example
 * ```ts
 * concatenate([1, 2], [3])                     // [1, 2, 3]
 * concatenate([1, 2], [2, 3], { unique: true }) // [1, 2, 3]
 * ```
 *
 * @category array
 */
export function concatenate<T>(
  first: readonly T[],
  second: readonly T[],
  options: ConcatenateOptions = {},
): T[] {
  const joined = [...first, ...second]
  if (options.unique === true) {
    return [...new Set(joined)]
  }
  return joined
}
