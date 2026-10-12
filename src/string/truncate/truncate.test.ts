import { afterEach, describe, expect, it, vi } from 'vitest'
import { truncate } from './truncate'

describe('truncate', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('strings that fit', () => {
    it('returns the input when it already fits within the length', () => {
      expect(truncate('hello', 10)).toBe('hello')
      expect(truncate('hello', 5)).toBe('hello')
      expect(truncate('hello', 5, { append: '...' })).toBe('hello')
    })

    it('returns the input when its grapheme count fits, even if its UTF-16 length does not', () => {
      expect(truncate('😀😀', 2, { append: '…' })).toBe('😀😀')
    })

    it('does not segment the input when its UTF-16 length already fits', () => {
      const segment = vi.spyOn(Intl.Segmenter.prototype, 'segment')
      truncate('hello', 5)
      expect(segment).not.toHaveBeenCalled()
    })

    it('returns an empty string for empty input', () => {
      expect(truncate('', 5)).toBe('')
    })
  })

  describe('default suffix', () => {
    it('appends nothing when no options are given', () => {
      expect(truncate('hello world', 5)).toBe('hello')
      expect(truncate('hello world', 4)).toBe('hell')
    })

    it('appends nothing when an options object is given without append', () => {
      expect(truncate('hello world', 5, { truncateAtWordBoundary: true })).toBe('hello')
      expect(truncate('hello world', 4, {})).toBe('hell')
    })
  })

  describe('length as a maximum', () => {
    it('counts the suffix towards the length by default', () => {
      expect(truncate('hello world', 8, { append: '...' })).toBe('hello...')
      expect(truncate('hello world', 10, { append: '...' })).toBe('hello w...')
    })

    it('adds the suffix after the length when includeAppendInLength is false', () => {
      expect(truncate('hello world', 5, { append: '...', includeAppendInLength: false })).toBe(
        'hello...',
      )
      expect(truncate('hello world', 8, { append: '…', includeAppendInLength: false })).toBe(
        'hello wo…',
      )
    })

    it('keeps the suffix when it is shorter than the length', () => {
      expect(truncate('hello world', 4, { append: '...' })).toBe('h...')
    })

    it('returns only the suffix when it is equal to the length', () => {
      expect(truncate('hello world', 3, { append: '...' })).toBe('...')
    })

    it('returns the hard cut without the suffix when the suffix is longer than the length', () => {
      expect(truncate('hello world', 2, { append: '...' })).toBe('he')
      expect(truncate('hello world', 1, { append: '...' })).toBe('h')
    })

    it('counts the suffix in graphemes', () => {
      expect(truncate('hello world', 6, { append: '👨‍👩‍👧' })).toBe('hello👨‍👩‍👧')
    })
  })

  describe('user-visible characters', () => {
    it('does not split a surrogate pair', () => {
      expect(truncate('ab😀cd', 3)).toBe('ab😀')
    })

    it('does not split a grapheme cluster joined by zero-width joiners', () => {
      expect(truncate('👨‍👩‍👧 family', 2)).toBe('👨‍👩‍👧')
    })

    it('keeps a combining accent with its base letter', () => {
      expect(truncate('café au lait', 4)).toBe('café')
    })
  })

  describe('word boundaries', () => {
    it('cuts at the last whitespace before the length', () => {
      expect(truncate('hello world', 8, { append: '...', truncateAtWordBoundary: true })).toBe(
        'hello...',
      )
      expect(truncate('hello world', 8, { truncateAtWordBoundary: true })).toBe('hello')
    })

    it('treats tabs and newlines as word boundaries', () => {
      expect(truncate('hello\tworld', 8, { truncateAtWordBoundary: true })).toBe('hello')
      expect(truncate('hello\nworld', 8, { truncateAtWordBoundary: true })).toBe('hello')
    })

    it('keeps the cut when it already ends a word', () => {
      expect(truncate('hello world foo', 11, { truncateAtWordBoundary: true })).toBe('hello world')
    })

    it('uses the hard cut when the only whitespace is at the start', () => {
      expect(truncate(' hello', 3, { truncateAtWordBoundary: true })).toBe(' he')
    })

    it('uses the hard cut when there is no whitespace before the cut', () => {
      expect(truncate('helloworld', 5, { append: '...', truncateAtWordBoundary: true })).toBe(
        'he...',
      )
    })
  })

  describe('trailing whitespace', () => {
    it('removes trailing whitespace before the suffix', () => {
      expect(truncate('hello world', 6, { append: '...', includeAppendInLength: false })).toBe(
        'hello...',
      )
    })

    it('removes trailing whitespace when there is no suffix', () => {
      expect(truncate('hello world', 6)).toBe('hello')
    })

    it('removes trailing whitespace from the hard cut when the suffix is too long', () => {
      expect(truncate('hello world', 6, { append: '1234567' })).toBe('hello')
    })
  })

  describe('length validation', () => {
    it('returns an empty string when the length is 0 or less', () => {
      expect(truncate('hello', 0)).toBe('')
      expect(truncate('hello', -1)).toBe('')
      expect(truncate('', 0)).toBe('')
      expect(truncate('hello', Number.NEGATIVE_INFINITY)).toBe('')
    })

    it('throws a RangeError when the length is NaN', () => {
      expect(() => truncate('hello', Number.NaN)).toThrow(RangeError)
    })

    it('rounds a non-integer length down', () => {
      expect(truncate('hello world', 5.9)).toBe('hello')
      expect(truncate('hello', 0.5)).toBe('')
      expect(truncate('hello world foo', 11.5, { truncateAtWordBoundary: true })).toBe(
        'hello world',
      )
    })

    it('returns the input when the length is Infinity', () => {
      expect(truncate('hello world', Number.POSITIVE_INFINITY)).toBe('hello world')
    })
  })

  describe('units', () => {
    it('counts in graphemes when unit is grapheme', () => {
      expect(truncate('😀😀😀', 2, { unit: 'grapheme' })).toBe('😀😀')
    })

    it('counts in UTF-16 code units when unit is codeUnit', () => {
      expect(truncate('😀😀😀', 2, { unit: 'codeUnit' })).toBe('😀')
    })

    it('counts in UTF-8 bytes when unit is byte', () => {
      expect(truncate('café', 4, { unit: 'byte' })).toBe('caf')
    })

    it('never cuts a grapheme, so the result can be empty', () => {
      expect(truncate('👨‍👩‍👧', 2, { unit: 'codeUnit' })).toBe('')
      expect(truncate('😀', 3, { unit: 'byte' })).toBe('')
    })

    it('can return a result that is shorter than the length', () => {
      expect(truncate('a😀b', 2, { unit: 'codeUnit' })).toBe('a')
      expect(truncate('ab😀', 5, { unit: 'byte' })).toBe('ab')
    })

    it('returns the input when it fits exactly', () => {
      expect(truncate('😀😀', 4, { unit: 'codeUnit' })).toBe('😀😀')
      // 'abcd' is not short enough for the byte fast path, so this measures each grapheme.
      expect(truncate('abcd', 4, { unit: 'byte' })).toBe('abcd')
    })

    it('measures the suffix in the unit', () => {
      // '…' is 1 code unit and 3 bytes.
      expect(truncate('hello world', 6, { append: '…', unit: 'codeUnit' })).toBe('hello…')
      expect(truncate('hello world', 6, { append: '…', unit: 'byte' })).toBe('hel…')
    })

    it('returns the cut text without the suffix when the suffix is longer than the length', () => {
      // '😀' is 1 grapheme but 2 code units. '…' is 1 grapheme but 3 bytes.
      expect(truncate('hello world', 1, { append: '😀', unit: 'codeUnit' })).toBe('h')
      expect(truncate('hello world', 2, { append: '…', unit: 'byte' })).toBe('he')
    })

    it('cuts at a word boundary within the limit in the unit', () => {
      const wordBoundary = { truncateAtWordBoundary: true } as const
      expect(truncate('😀😀 😀😀😀', 8, { ...wordBoundary, unit: 'codeUnit' })).toBe('😀😀')
      expect(truncate('café au lait', 7, { ...wordBoundary, unit: 'byte' })).toBe('café')
    })
  })

  it('accepts a frozen options object', () => {
    const options = Object.freeze({ append: '...', truncateAtWordBoundary: true })
    expect(truncate('hello world', 8, options)).toBe('hello...')
    expect(options).toEqual({ append: '...', truncateAtWordBoundary: true })
  })

  it('matches each TSDoc example', () => {
    expect(truncate('hello world', 5)).toBe('hello')
    expect(truncate('hello world', 8, { append: '...' })).toBe('hello...')
    expect(truncate('hello world', 5, { append: '...', includeAppendInLength: false })).toBe(
      'hello...',
    )
    expect(truncate('hello world', 2, { append: '...' })).toBe('he')
    expect(truncate('hello world foo', 13, { truncateAtWordBoundary: true })).toBe('hello world')
    expect(truncate('hello world foo', 11, { truncateAtWordBoundary: true })).toBe('hello world')
    expect(truncate('hello world', 6)).toBe('hello')
    expect(truncate('ab😀cd', 3)).toBe('ab😀')
    expect(truncate('café au lait', 4)).toBe('café')
    expect(truncate('hello world', 5.9)).toBe('hello')
    expect(truncate('hello world', Number.POSITIVE_INFINITY)).toBe('hello world')
    expect(truncate('hello world', 0)).toBe('')
    expect(() => truncate('hello world', Number.NaN)).toThrow(RangeError)
  })
})
