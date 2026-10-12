import type { TruncateOptions } from './truncate.types'

export type * from './truncate.types'

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
const whitespace = /\s/u

function resolveTruncateOptions(options?: TruncateOptions): Required<TruncateOptions> {
  return {
    append: options?.append ?? '',
    includeAppendInLength: options?.includeAppendInLength ?? true,
    truncateAtWordBoundary: options?.truncateAtWordBoundary ?? false,
  }
}

function resolveLength(length: number): number {
  if (Number.isNaN(length)) {
    throw new RangeError('truncate: length must be a number, received NaN')
  }

  return Math.floor(length)
}

function splitGraphemes(input: string): string[] {
  return Array.from(graphemeSegmenter.segment(input), ({ segment }) => segment)
}

function findWordBoundary(graphemes: readonly string[], cut: number): number {
  // Include the grapheme after the cut: if it is whitespace, the cut already ends a word.
  const boundary = graphemes
    .slice(0, cut + 1)
    .map((grapheme) => whitespace.test(grapheme))
    .lastIndexOf(true)

  // A boundary at index 0 would leave no text, so the hard cut is better.
  return boundary > 0 ? boundary : cut
}

function cutGraphemes(graphemes: readonly string[], cut: number): string {
  return graphemes.slice(0, cut).join('').trimEnd()
}

/**
 * The truncate function shortens a string to a maximum length. It can add a suffix and cut at a
 * word boundary.
 *
 * Lengths are counted in grapheme clusters (user-visible characters), so the function never splits
 * an emoji or separates an accent from its letter. Trailing whitespace is removed from the cut text.
 *
 * @param input - The string to truncate. If the input already fits, the function returns it unchanged.
 * @param length - The maximum length of the result. If `length` is not an integer, the function rounds it down. If `length` is 0 or less, the function returns an empty string. If `length` is `Infinity`, the function returns the input.
 * @param options - The suffix to add, whether the suffix counts towards `length`, and whether to cut at a word boundary. See {@link TruncateOptions}.
 * @returns The truncated string, with the suffix if the input was cut.
 * @throws {RangeError} If `length` is `NaN`.
 *
 * @example
 * ```ts
 * truncate('hello world', 5) // 'hello'
 * truncate('hello world', 8, { append: '...' }) // 'hello...'
 * truncate('hello world', 5, { append: '...', includeAppendInLength: false }) // 'hello...'
 * truncate('hello world', 2, { append: '...' }) // 'he'
 * truncate('hello world foo', 13, { truncateAtWordBoundary: true }) // 'hello world'
 * truncate('hello world foo', 11, { truncateAtWordBoundary: true }) // 'hello world'
 * truncate('hello world', 6) // 'hello'
 * truncate('ab😀cd', 3) // 'ab😀'
 * truncate('café au lait', 4) // 'café'
 * truncate('hello world', 5.9) // 'hello'
 * truncate('hello world', Infinity) // 'hello world'
 * truncate('hello world', 0) // ''
 * truncate('hello world', NaN) // throws RangeError
 * ```
 * @category string
 */
export function truncate(input: string, length: number, options?: TruncateOptions): string {
  const maxLength = resolveLength(length)
  if (maxLength <= 0) {
    return ''
  }

  // A string never has more graphemes than UTF-16 code units, so this skips the segmenter safely.
  if (input.length <= maxLength) {
    return input
  }

  const graphemes = splitGraphemes(input)
  if (graphemes.length <= maxLength) {
    return input
  }

  const { append, includeAppendInLength, truncateAtWordBoundary } = resolveTruncateOptions(options)
  const appendLength = splitGraphemes(append).length

  if (includeAppendInLength && appendLength > maxLength) {
    return cutGraphemes(graphemes, maxLength)
  }

  const available = includeAppendInLength ? maxLength - appendLength : maxLength
  const cut = truncateAtWordBoundary ? findWordBoundary(graphemes, available) : available

  return cutGraphemes(graphemes, cut) + append
}
