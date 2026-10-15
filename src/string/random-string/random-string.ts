import { withDefaults } from '../../object'
import { RandomStringCharset, type RandomStringOptions } from './random-string.types'

export * from './random-string.types'

const RANGE = 2 ** 32
// getRandomValues fills at most 65536 bytes per call.
const MAX_BATCH = 65536 / Uint32Array.BYTES_PER_ELEMENT

/**
 * Makes a random string from a set of characters. It uses `crypto.getRandomValues`
 * and has no modulo bias, so the result is safe to use for tokens and passwords.
 *
 * @param options - Optional. See {@link RandomStringOptions}.
 * @returns A string of `length` characters. A `length` of 0 gives `''`.
 * @throws {RangeError} If `length` is not an integer of 0 or more, or if `charset` is empty.
 *
 * @example
 * ```ts
 * randomString() // 'f3Kq9ZbT0xLmA2pR'
 * randomString({ length: 8, charset: RandomStringCharset.hex }) // '9c4e01ab'
 * randomString({ charset: RandomStringCharset.uppercase + RandomStringCharset.digits }) // 'Q7ZK2M9XA0B4TR1C'
 * randomString({ length: 6, charset: 'ab' }) // 'babbab'
 * randomString({ length: 0 }) // ''
 * randomString({ length: -1 }) // throws RangeError
 * randomString({ charset: '' }) // throws RangeError
 * ```
 *
 * @category string
 */
export function randomString(options?: RandomStringOptions): string {
  const opts = withDefaults(options, {
    length: 16,
    charset: RandomStringCharset.alphanumeric,
  })

  if (!Number.isInteger(opts.length) || opts.length < 0) {
    throw new RangeError(`randomString: length (${opts.length}) must be an integer of 0 or more`)
  }
  // A Set of a string splits it by code point, so characters such as emoji stay whole.
  const chars = [...new Set(opts.charset)]
  if (chars.length === 0) {
    throw new RangeError('randomString: charset must contain at least one character')
  }

  // Values at or above the largest multiple of chars.length would make some characters more likely.
  const limit = RANGE - (RANGE % chars.length)
  const buffer = new Uint32Array(Math.min(opts.length, MAX_BATCH))
  let result = ''
  let count = 0
  while (count < opts.length) {
    crypto.getRandomValues(buffer)
    for (const value of buffer) {
      if (value >= limit) continue
      result += chars[value % chars.length]
      count++
      if (count === opts.length) break
    }
  }
  return result
}
