export type * from './exclamationmark.types'
import { createPunctuationReplacer } from '../../_internal/string/punctuationReplacer/punctuationReplacer'
import type { ExclamationmarkOptions } from './exclamationmark.types'

/**
 * Ensures that the input string ends with an exclamation mark.
 *
 * @param input - Takes a string, considered to be a sentence, and ensures it ends in an exclamation mark. Use the options to customize the behaviour.
 * @param options - Optional. See {@link ExclamationmarkOptions}.
 * @returns The string with the punctuation added at the end.
 *
 * @example
 * ```ts
 * exclamationmark('watch out') // 'watch out!'
 * ```
 *
 * @category string
 */
export function exclamationmark(input: string, options?: ExclamationmarkOptions): string {
  return createPunctuationReplacer('!')(input, options)
}
