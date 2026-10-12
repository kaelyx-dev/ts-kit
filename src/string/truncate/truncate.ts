import { takeGraphemes } from '../../_internal/string/graphemes/graphemes'
import type { TruncateOptions } from './truncate.types'

export type * from './truncate.types'

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
const whitespace = /\s/u
const utf8 = new TextEncoder()

type Unit = Required<TruncateOptions>['unit']

function resolveTruncateOptions(options?: TruncateOptions): Required<TruncateOptions> {
  return {
    append: options?.append ?? '',
    includeAppendInLength: options?.includeAppendInLength ?? true,
    truncateAtWordBoundary: options?.truncateAtWordBoundary ?? false,
    unit: options?.unit ?? 'grapheme',
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

function graphemeSize(grapheme: string, unit: Unit): number {
  if (unit === 'grapheme') return 1
  if (unit === 'codeUnit') return grapheme.length
  return utf8.encode(grapheme).length
}

function totalSize(graphemes: readonly string[], unit: Unit): number {
  return graphemes.reduce((total, grapheme) => total + graphemeSize(grapheme, unit), 0)
}

/**
 * The number of graphemes, from the start, whose total size is not more than `available`. The
 * caller passes only graphemes that do not all fit, so a grapheme always takes the total over.
 */
function countFitting(graphemes: readonly string[], available: number, unit: Unit): number {
  let total = 0
  return graphemes.findIndex((grapheme) => {
    total += graphemeSize(grapheme, unit)
    return total > available
  })
}

/**
 * True if the input fits without segmenting it. A string never has more graphemes than code
 * units, and one code unit is never more than 3 bytes in UTF-8.
 */
function fitsWithoutSegmenting(input: string, maxLength: number, unit: Unit): boolean {
  return unit === 'byte' ? input.length * 3 <= maxLength : input.length <= maxLength
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
 * By default, lengths are counted in grapheme clusters (user-visible characters). Set `unit` to
 * count in UTF-16 code units or in UTF-8 bytes. In each unit, the function cuts only between
 * graphemes, so it never splits an emoji or separates an accent from its letter. Trailing
 * whitespace is removed from the cut text.
 *
 * @param input - The string to truncate. If the input already fits, the function returns it unchanged.
 * @param length - The maximum length of the result. If `length` is not an integer, the function rounds it down. If `length` is 0 or less, the function returns an empty string. If `length` is `Infinity`, the function returns the input.
 * @param options - The suffix to add, whether the suffix counts towards `length`, whether to cut at a word boundary, and the unit that lengths count in. See {@link TruncateOptions}.
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

  const { append, includeAppendInLength, truncateAtWordBoundary, unit } =
    resolveTruncateOptions(options)

  if (fitsWithoutSegmenting(input, maxLength, unit)) {
    return input
  }

  // Each grapheme has a size of 1 or more, so no more than maxLength graphemes fit. findWordBoundary
  // also reads the grapheme after the cut. Fewer than maxLength + 1 graphemes is all of the input.
  const graphemes = takeGraphemes(graphemeSegmenter.segment(input), maxLength + 1)
  if (graphemes.length <= maxLength && totalSize(graphemes, unit) <= maxLength) {
    return input
  }

  const appendSize = totalSize(splitGraphemes(append), unit)

  if (includeAppendInLength && appendSize > maxLength) {
    return cutGraphemes(graphemes, countFitting(graphemes, maxLength, unit))
  }

  const available = includeAppendInLength ? maxLength - appendSize : maxLength
  const fitting = countFitting(graphemes, available, unit)
  const cut = truncateAtWordBoundary ? findWordBoundary(graphemes, fitting) : fitting

  return cutGraphemes(graphemes, cut) + append
}
