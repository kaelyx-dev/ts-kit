import { describe, expect, it } from 'vitest'
import { truncate } from './truncate'

describe('truncate', () => {
  it('returns the original string when it already fits within the requested length', () => {
    expect(truncate('hello', 10)).toBe('hello')
    expect(truncate('hello', 5)).toBe('hello')
    expect(truncate('hello', 5, { append: '...' })).toBe('hello')
  })

  it('returns an empty string for empty input or non-positive lengths', () => {
    expect(truncate('', 5)).toBe('')
    expect(truncate('hello', 0)).toBe('')
    expect(truncate('hello', -1)).toBe('')
    expect(truncate('', 0)).toBe('')
  })

  it('truncates plain strings without appending a suffix when no options are provided', () => {
    expect(truncate('hello world', 5)).toBe('hello')
    expect(truncate('hello world', 4)).toBe('hell')
  })

  it('appends the configured suffix when truncation occurs with options', () => {
    expect(truncate('hello world', 5, { append: '...' })).toBe('hello...')
    expect(truncate('hello world', 8, { append: '…' })).toBe('hello wo…')
  })

  it('counts the suffix length as part of the total when includeAppendInLength is enabled', () => {
    expect(truncate('hello world', 8, { append: '...', includeAppendInLength: true })).toBe('hello...')
    expect(truncate('hello world', 10, { append: '...', includeAppendInLength: true })).toBe('hello w...')
  })

  it('truncates at the last word boundary when enabled', () => {
    expect(truncate('hello world', 8, { append: '...', truncateAtWordBoundary: true })).toBe('hello...')
    expect(truncate('helloworld', 5, { append: '...', truncateAtWordBoundary: true })).toBe('hello...')
  })

  it('keeps the final value within the requested length even when the suffix is longer than the available space', () => {
    expect(truncate('hello world', 2, { append: '...', includeAppendInLength: true })).toBe('..')
    expect(truncate('hello world', 1, { append: '...', includeAppendInLength: true })).toBe('.')
  })
})
