export * from './exclamationmark.types'
import { createPunctuationReplacer } from '../../_internal/string/punctuationReplacer/punctuationReplacer'
import type { ExclamationmarkOptions } from './exclamationmark.types'

const addPunctuation = /* @__PURE__ */ createPunctuationReplacer('!')

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
 * exclamationmark('watch out.') // 'watch out!'
 * exclamationmark('no way?.') // 'no way!'
 * exclamationmark('no way?.', { collapse: false }) // 'no way?!'
 * exclamationmark('watch out   ', { trim: false }) // 'watch out   !'
 * exclamationmark('', { skipEmpty: false }) // '!'
 * ```
 *
 * @category string
 */
export function exclamationmark(input: string, options?: ExclamationmarkOptions): string {
  return addPunctuation(input, options)
}
