import type { Result } from '../..';

export type * from './ok.types'

/**
 * One sentence that says what the function does.
 *
 * @param input - The data. Say what an empty value does.
 * @returns Say what comes back.
 * @throws If the function throws, say when. Delete this line if it does not.
 *
 * @example
 * ```ts
 * ok() // result
 * ```
 *
 * @category result
 */
export function ok<T>(input: T): Result<T, never> {
  return { ok: true, value: input }
}
