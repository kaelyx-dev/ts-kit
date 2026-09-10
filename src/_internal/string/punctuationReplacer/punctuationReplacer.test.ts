import { describe, expect, it } from 'vitest'
import { createPunctuationReplacer, withPunctuation } from './punctuationReplacer'

describe('createPunctuationReplacer', () => {
  const fullstop = createPunctuationReplacer('.')

  it('adds the punctuation character when it is missing', () => {
    expect(fullstop('hello')).toBe('hello.')
  })

  it('leaves the value unchanged when it already ends with that character', () => {
    expect(fullstop('hello.')).toBe('hello.')
  })

  it('collapses a run of replacement characters into one, by default', () => {
    expect(fullstop('What?!')).toBe('What.')
  })

  it('replaces only the last character when collapse is false', () => {
    expect(fullstop('What?!', { collapse: false })).toBe('What?.')
  })

  it('replaces a custom set of characters given as an option', () => {
    expect(fullstop('a list;', { replacementCharacters: [';'] })).toBe('a list.')
  })

  it('trims trailing whitespace before deciding, by default', () => {
    expect(fullstop('hello   ')).toBe('hello.')
  })

  it('does not trim trailing whitespace when trim is false', () => {
    expect(fullstop('hello   ', { trim: false })).toBe('hello   .')
  })

  it('leaves an empty string alone, by default', () => {
    expect(fullstop('')).toBe('')
  })

  it('returns bare punctuation for an empty string when skipEmpty is false', () => {
    expect(fullstop('', { skipEmpty: false })).toBe('.')
  })

  it('collapses down to bare punctuation when the whole string is replacement characters', () => {
    expect(fullstop('???')).toBe('.')
  })

  it('treats a surrogate pair as one character, not two', () => {
    expect(fullstop('Hi 😀')).toBe('Hi 😀.')
  })

  it('rejects a character outside the bound alphabet at compile time', () => {
    // @ts-expect-error '#' is not one of PUNCTUATION_CHARACTERS
    createPunctuationReplacer('#')
  })
})

describe('withPunctuation', () => {
  it('binds a replacer factory to a custom alphabet', () => {
    const ideographicStop = withPunctuation(['。', '！', '？'])('。')
    expect(ideographicStop('こんにちは？')).toBe('こんにちは。')
  })
})
