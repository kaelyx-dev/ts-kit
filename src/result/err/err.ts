export type * from './err.types'
import type { Result } from '../..';

/**
 * One sentence that says what the function does.
 *
 * @param input - The data. Say what an empty value does.
 * @returns Say what comes back.
 * @throws If the function throws, say when. Delete this line if it does not.
 *
 * @example
 * ```ts
 * err() // result
 * ```
 *
 * @category result
 */
export function err<E>(input: E): Result<never, E> {
  return { ok: false, error: input }
}
