import { describe, expect, it } from 'vitest'
import { fullstop } from './fullstop'

describe('fullstop', () => {
  it('adds a full stop when the string does not end with one', () => {
    expect(fullstop('hello')).toBe('hello.')
  })

  it('leaves the string unchanged when it already ends with a full stop', () => {
    expect(fullstop('hello.')).toBe('hello.')
  })

  it('leaves an empty string alone', () => {
    expect(fullstop('')).toBe('')
  })

  it('passes options through to the underlying replacer', () => {
    expect(fullstop('hello   ', { trim: false })).toBe('hello   .')
  })
})
