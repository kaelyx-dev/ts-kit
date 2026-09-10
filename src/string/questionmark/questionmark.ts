export type * from './questionmark.types'
import { createPunctuationReplacer } from '../../_internal/string/punctuationReplacer/punctuationReplacer'
import type { QuestionmarkOptions } from './questionmark.types'

/**
 * Ensures that the input string ends with a question mark.
 *
 * @param input - Takes a string, considered to be a sentence, and ensures it ends in a question mark. Use the options to customize the behaviour.
 * @param options - Optional. See {@link QuestionmarkOptions}.
 * @returns The string with the punctuation added at the end.
 *
 * @example
 * ```ts
 * questionmark('are you sure') // 'are you sure?'
 * ```
 *
 * @category string
 */
export function questionmark(input: string, options?: QuestionmarkOptions): string {
  return createPunctuationReplacer('?')(input, options)
}
