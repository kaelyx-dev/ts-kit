import type { TruncateOptions } from './truncate.types'

export type * from './truncate.types'

/**
 * The truncate function shortens a string to a specified length, optionally appending a string and truncating at word boundaries.
 *
 * @param input - The string to be truncated. If the string is empty, it will return an empty string.
 * @param length - The maximum length of the truncated string. If the length is less than or equal to 0, it will return an empty string.
 * @param options - Optional settings for truncation, including the string to append, whether to include the append string in the total length, and whether to truncate at word boundaries.
 * @returns The truncated string, potentially with the append string added at the end.
 *
 * @example
 * ```ts
 * truncate('hello world', 5) // 'hello'
 * truncate('hello world', 5, { append: '...', includeAppendInLength: true }) // 'he...'
 * truncate('hello world', 5, { truncateAtWordBoundary: true }) // 'hello'
 * truncate('hello world', 5, { append: '...', includeAppendInLength: true, truncateAtWordBoundary: true }) // 'he...'
 * truncate('hello world', 0) // ''
 * truncate('', 5) // ''
 * truncate('hello world', -1) // ''
 * ```
 * @category string
 */
export function truncate(input: string, length: number, options?: TruncateOptions): string {
  if (length <= 0 || input.length === 0) {
    return ''
  }

  if (input.length <= length) {
    return input
  }

  if (options === undefined) {
    return input.substring(0, length)
  }

  const { append = '...', includeAppendInLength = false, truncateAtWordBoundary = false } = options
  const availableLength = includeAppendInLength ? Math.max(0, length - append.length) : length
  let truncated = input.substring(0, availableLength)

  if (truncateAtWordBoundary) {
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    if (lastSpaceIndex > -1) {
      truncated = truncated.substring(0, lastSpaceIndex)
    }
  }

  const result = truncated + append
  return includeAppendInLength ? result.substring(0, length) : result
}
