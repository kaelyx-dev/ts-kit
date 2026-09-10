import { describe, expect, it } from 'vitest'
import { exclamationmark } from './exclamationmark'

describe('exclamationmark', () => {
  it('adds an exclamation mark when the string does not end with one', () => {
    expect(exclamationmark('watch out')).toBe('watch out!')
  })

  it('leaves the string unchanged when it already ends with an exclamation mark', () => {
    expect(exclamationmark('watch out!')).toBe('watch out!')
  })

  it('leaves an empty string alone', () => {
    expect(exclamationmark('')).toBe('')
  })

  it('passes options through to the underlying replacer', () => {
    expect(exclamationmark('watch out   ', { trim: false })).toBe('watch out   !')
  })
})
