// Public types for truncate.
// Every exported name must start with "Truncate".
/**
 * Options for `truncate`.
 *
 * All lengths are counted in `unit`. The default unit is grapheme clusters (user-visible
 * characters), not UTF-16 code units.
 *
 * @category string
 */
export interface TruncateOptions {
  /**
   * The suffix to add after the cut text. It is only added when the input is cut.
   * @default ''
   */
  readonly append?: string

  /**
   * Count the suffix towards `length`, so that the result is never longer than `length`.
   * If the suffix is longer than `length`, the result is the cut text without the suffix.
   * Set to `false` to add the suffix after `length` characters.
   * @default true
   */
  readonly includeAppendInLength?: boolean

  /**
   * Cut at the last whitespace before the limit instead of in the middle of a word.
   * If there is no whitespace before the limit, the text is cut at the limit.
   * @default false
   */
  readonly truncateAtWordBoundary?: boolean

  /**
   * The unit that `length` and the length of `append` count in.
   *
   * - `'grapheme'`: grapheme clusters (user-visible characters).
   * - `'codeUnit'`: UTF-16 code units, the unit of `.length`.
   * - `'byte'`: bytes when the text is encoded as UTF-8.
   *
   * The cut is always between graphemes.
   * @default 'grapheme'
   */
  readonly unit?: 'grapheme' | 'codeUnit' | 'byte'
}
