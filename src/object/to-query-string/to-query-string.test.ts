import { describe, expect, it } from 'vitest'
import { fromQueryString } from '../from-query-string/from-query-string'
import { toQueryString } from './to-query-string'

describe('toQueryString', () => {
  it('returns an empty string for an empty object', () => {
    expect(toQueryString({})).toBe('')
  })

  it('writes strings, numbers and booleans as text', () => {
    expect(toQueryString({ q: 'red shoes', page: 2, sale: false })).toBe(
      'q=red+shoes&page=2&sale=false',
    )
  })

  it('URL-encodes keys and values', () => {
    expect(toQueryString({ 'a&b': 'c=d', e: '日本' })).toBe('a%26b=c%3Dd&e=%E6%97%A5%E6%9C%AC')
  })

  it('writes null as an empty string', () => {
    expect(toQueryString({ a: null })).toBe('a=')
  })

  it('omits undefined values', () => {
    expect(toQueryString({ a: undefined, b: '1' })).toBe('b=1')
  })

  it('writes a date as an ISO string', () => {
    expect(toQueryString({ at: new Date(0) })).toBe('at=1970-01-01T00%3A00%3A00.000Z')
  })

  it('throws a RangeError for an invalid date', () => {
    expect(() => toQueryString({ at: new Date(Number.NaN) })).toThrow(RangeError)
  })

  it('writes an array as repeated keys, in order', () => {
    expect(toQueryString({ tags: ['new', 'sale'] })).toBe('tags=new&tags=sale')
  })

  it('writes each array item with the same rules as a single value', () => {
    expect(toQueryString({ v: [1, true, null, new Date(0)] })).toBe(
      'v=1&v=true&v=&v=1970-01-01T00%3A00%3A00.000Z',
    )
  })

  it('omits undefined array items and empty arrays', () => {
    expect(toQueryString({ v: ['a', undefined, 'b'], empty: [] })).toBe('v=a&v=b')
  })

  it('accepts a readonly array', () => {
    const tags = ['a', 'b'] as const
    expect(toQueryString({ tags })).toBe('tags=a&tags=b')
  })

  it('writes the same text that fromQueryString reads', () => {
    const input = { q: 'red shoes', tags: ['new', 'sale'], empty: '' }
    expect(fromQueryString(toQueryString(input))).toEqual(input)
  })

  it('documented examples', () => {
    expect(toQueryString({ q: 'red shoes', page: 2 })).toBe('q=red+shoes&page=2')
    expect(toQueryString({ tags: ['new', 'sale'] })).toBe('tags=new&tags=sale')
    expect(toQueryString({ a: null, b: undefined })).toBe('a=')
    expect(toQueryString({ at: new Date(0) })).toBe('at=1970-01-01T00%3A00%3A00.000Z')
  })
})
