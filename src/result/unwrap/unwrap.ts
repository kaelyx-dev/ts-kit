import type { Result } from '../..'

export type * from './unwrap.types'

/**
 * One sentence that says what the function does.
 *
 * @param input - The data. Say what an empty value does.
 * @returns Say what comes back.
 * @throws If the function throws, say when. Delete this line if it does not.
 *
 * @example
 * ```ts
 * unwrap() // result
 * ```
 *
 * @category result
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value
  } else {
    throw new Error('Attempted to unwrap an Err result')
  }
}
