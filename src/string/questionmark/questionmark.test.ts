import { describe, expect, it } from 'vitest'
import { questionmark } from './questionmark'

describe('questionmark', () => {
  it('adds a question mark when the string does not end with one', () => {
    expect(questionmark('are you sure')).toBe('are you sure?')
  })

  it('leaves the string unchanged when it already ends with a question mark', () => {
    expect(questionmark('are you sure?')).toBe('are you sure?')
  })

  it('leaves an empty string alone', () => {
    expect(questionmark('')).toBe('')
  })

  it('passes options through to the underlying replacer', () => {
    expect(questionmark('are you sure   ', { trim: false })).toBe('are you sure   ?')
  })
})
