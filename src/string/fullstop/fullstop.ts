export type * from './fullstop.types'
import { createPunctuationReplacer } from '../../_internal/string/punctuationReplacer/punctuationReplacer'
import type { FullstopOptions } from './fullstop.types'

/**
 * Ensures that the input string ends with a full stop (period).
 *
 * @param input - Takes a string, considered to be a sentence, and ensure it ends in a fullstop (period). Use the options to customize the behaviour.
 * @param options - Optional. See {@link FullstopOptions}.
 * @returns The string with the punctuation added at the end.
 *
 * @example
 * ```ts
 * fullstop('hello') // 'hello.'
 * ```
 *
 * @category string
 */
export function fullstop(input: string, options?: FullstopOptions): string {
  return createPunctuationReplacer('.')(input, options)
}
