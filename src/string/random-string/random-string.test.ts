import { afterEach, describe, expect, it, vi } from 'vitest'
import { randomString } from './random-string'
import { RandomStringCharset } from './random-string.types'

/** Makes getRandomValues return the given values in order. */
function mockRandomValues(values: number[]) {
  const queue = [...values]
  vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
    for (let i = 0; i < array.length; i++) {
      const next = queue.shift()
      if (next === undefined) throw new Error('mockRandomValues: no values left')
      array[i] = next
    }
    return array
  })
}

describe('randomString', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('gives 16 alphanumeric characters by default', () => {
    const result = randomString()
    expect(result).toHaveLength(16)
    expect(result).toMatch(/^[A-Za-z0-9]{16}$/)
  })

  it('uses the given length', () => {
    expect(randomString({ length: 5 })).toHaveLength(5)
    expect(randomString({ length: 100 })).toHaveLength(100)
  })

  it('returns an empty string for a length of 0', () => {
    expect(randomString({ length: 0 })).toBe('')
  })

  it('uses only characters from the charset', () => {
    const charset = RandomStringCharset.hex + RandomStringCharset.symbolsSimple
    const result = randomString({ length: 500, charset })
    for (const char of result) expect(charset).toContain(char)
  })

  it('accepts a custom charset', () => {
    expect(randomString({ length: 10, charset: 'x' })).toBe('xxxxxxxxxx')
  })

  it('ignores duplicate characters in the charset', () => {
    // Without removing duplicates, 'aab' has 3 entries and 1 would pick 'a'.
    mockRandomValues([0, 1, 2, 3])
    expect(randomString({ length: 4, charset: 'aab' })).toBe('abab')
  })

  it('accepts overlapping presets', () => {
    const { symbols, symbolsSimple } = RandomStringCharset
    mockRandomValues([0])
    expect(randomString({ length: 1, charset: symbolsSimple + symbols })).toBe('-')
  })

  it('keeps characters with more than one UTF-16 code unit whole', () => {
    mockRandomValues([0, 1])
    expect(randomString({ length: 2, charset: '😀😎' })).toBe('😀😎')
  })

  it('rejects values that would cause modulo bias', () => {
    // 2^32 % 3 is 1, so the largest value is rejected and the next value is used.
    mockRandomValues([2 ** 32 - 1, 2 ** 32 - 2])
    expect(randomString({ length: 1, charset: 'abc' })).toBe('c')
    expect(crypto.getRandomValues).toHaveBeenCalledTimes(2)
  })

  it('works for a length larger than one getRandomValues call allows', () => {
    expect(randomString({ length: 20_000 })).toHaveLength(20_000)
  })

  it('uses the defaults for undefined options', () => {
    expect(randomString({ length: undefined, charset: undefined })).toMatch(/^[A-Za-z0-9]{16}$/)
  })

  it('throws for a length that is not an integer of 0 or more', () => {
    expect(() => randomString({ length: -1 })).toThrow(RangeError)
    expect(() => randomString({ length: 1.5 })).toThrow(RangeError)
    expect(() => randomString({ length: Number.NaN })).toThrow(RangeError)
    expect(() => randomString({ length: Number.POSITIVE_INFINITY })).toThrow(RangeError)
  })

  it('throws for an empty charset', () => {
    expect(() => randomString({ charset: '' })).toThrow(RangeError)
  })
})
