import { describe, expect, it } from 'vitest'
import { fromQueryString } from './from-query-string'

describe('fromQueryString', () => {
  it('returns an empty object for an empty string', () => {
    expect(fromQueryString('')).toEqual({})
    expect(fromQueryString('?')).toEqual({})
  })

  it('reads each key as a string, and does not convert values', () => {
    expect(fromQueryString('q=red+shoes&page=2&sale=false')).toEqual({
      q: 'red shoes',
      page: '2',
      sale: 'false',
    })
  })

  it('removes a leading question mark', () => {
    expect(fromQueryString('?a=1')).toEqual({ a: '1' })
  })

  it('decodes URL-encoded keys and values', () => {
    expect(fromQueryString('a%26b=c%3Dd&e=%E6%97%A5%E6%9C%AC')).toEqual({ 'a&b': 'c=d', e: '日本' })
  })

  it('reads a key with no value as an empty string', () => {
    expect(fromQueryString('a=&b')).toEqual({ a: '', b: '' })
  })

  it('reads a repeated key as an array, in order', () => {
    expect(fromQueryString('tags=new&x=1&tags=sale')).toEqual({ tags: ['new', 'sale'], x: '1' })
  })

  it('does not split keys', () => {
    expect(fromQueryString('a.b=1&c[d]=2')).toEqual({ 'a.b': '1', 'c[d]': '2' })
  })

  it('keeps a __proto__ key as an own property, and does not change the prototype', () => {
    const result = fromQueryString('__proto__=a&__proto__=b&constructor=c')
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(Object.hasOwn(result, '__proto__')).toBe(true)
    expect(result.__proto__).toEqual(['a', 'b'])
    expect(result.constructor).toBe('c')
  })

  it('documented examples', () => {
    expect(fromQueryString('q=red+shoes&page=2')).toEqual({ q: 'red shoes', page: '2' })
    expect(fromQueryString('?tags=new&tags=sale')).toEqual({ tags: ['new', 'sale'] })
    expect(fromQueryString('a=')).toEqual({ a: '' })
  })
})
