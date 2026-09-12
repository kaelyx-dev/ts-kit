import { describe, expect, it } from 'vitest'
import { fromQueryString } from './from-query-string'

describe('fromQueryString', () => {
  it('returns an empty object for an empty query string', () => {
    expect(fromQueryString('')).toEqual({})
    expect(fromQueryString('?')).toEqual({})
  })

  it('strips a leading question mark', () => {
    expect(fromQueryString('?name=Ada&city=New+York')).toEqual({
      name: 'Ada',
      city: 'New York',
    })
  })

  it('decodes URL-encoded keys and values', () => {
    expect(fromQueryString('first%20name=Ada%20Lovelace&symbol=%26%3D')).toEqual({
      'first name': 'Ada Lovelace',
      symbol: '&=',
    })
  })

  it('parses JSON values by default', () => {
    expect(fromQueryString('count=42&enabled=true&empty=null&items=%5B1%2C2%5D')).toEqual({
      count: 42,
      enabled: true,
      empty: null,
      items: [1, 2],
    })
  })

  it('keeps ordinary strings as strings', () => {
    expect(fromQueryString('name=Ada&code=001&word=falseish')).toEqual({
      name: 'Ada',
      code: '001',
      word: 'falseish',
    })
  })

  it('round-trips JSON serialized as a query value', () => {
    expect(fromQueryString('filters=%7B%22status%22%3A%22open%22%2C%22page%22%3A2%7D')).toEqual({
      filters: { status: 'open', page: 2 },
    })
  })

  it('can disable JSON parsing while retaining raw values', () => {
    expect(
      fromQueryString('count=42&enabled=true&filters=%7B%22open%22%3Atrue%7D', {
        parseJson: false,
      }),
    ).toEqual({
      count: '42',
      enabled: 'true',
      filters: '{"open":true}',
    })
  })

  it('coerces primitive strings only when requested', () => {
    expect(fromQueryString('count=42&enabled=true&name=Ada', { parseJson: false })).toEqual({
      count: '42',
      enabled: 'true',
      name: 'Ada',
    })

    expect(
      fromQueryString('count=42&enabled=true&name=Ada', {
        parseJson: false,
        parsePrimitives: true,
      }),
    ).toEqual({
      count: 42,
      enabled: true,
      name: 'Ada',
    })
  })

  it('coerces numeric boundary and whitespace values when primitive parsing is enabled', () => {
    expect(
      fromQueryString('zero=0&negative=-3.5&exponent=1e3&spaced=%2012%20', {
        parseJson: false,
        parsePrimitives: true,
      }),
    ).toEqual({
      zero: 0,
      negative: -3.5,
      exponent: 1000,
      spaced: 12,
    })
  })

  it('preserves empty values as empty strings', () => {
    expect(fromQueryString('empty=&also-empty')).toEqual({
      empty: '',
      'also-empty': '',
    })
  })

  it('uses the last value for repeated keys', () => {
    expect(fromQueryString('tag=first&tag=second&tag=third')).toEqual({ tag: 'third' })
  })

  it('rebuilds nested objects from dotted keys by default', () => {
    expect(fromQueryString('user.name=Ada&user.active=true')).toEqual({
      user: { name: 'Ada', active: true },
    })
  })

  it('supports a custom deep separator', () => {
    expect(fromQueryString('user/name=Ada&user/age=37', { deepSeparator: '/' })).toEqual({
      user: { name: 'Ada', age: 37 },
    })
  })

  it('keeps separators in keys when deep parsing is disabled', () => {
    expect(fromQueryString('user.name=Ada&user.age=37', { deep: false })).toEqual({
      'user.name': 'Ada',
      'user.age': 37,
    })
  })

  it('preserves the remainder of a key after the deep split limit', () => {
    expect(fromQueryString('a.b.c.d=value', { deepLimit: 1 })).toEqual({
      a: { 'b.c.d': 'value' },
    })
    expect(fromQueryString('a.b.c.d=value', { deepLimit: 2 })).toEqual({
      a: { b: { 'c.d': 'value' } },
    })
  })

  it('keeps the full key literal when the deep limit is zero', () => {
    expect(fromQueryString('a.b=value', { deepLimit: 0 })).toEqual({ 'a.b': 'value' })
  })

  it('handles collisions between paths according to query order', () => {
    expect(fromQueryString('user.name=Ada&user=anonymous')).toEqual({ user: 'anonymous' })
    expect(fromQueryString('user=anonymous&user.name=Ada')).toEqual({
      user: { name: 'Ada' },
    })
  })

  it('ignores unsafe top-level keys', () => {
    expect(
      fromQueryString('__proto__.polluted=yes&constructor.value=no&prototype.value=no'),
    ).toEqual({})
    expect(Object.prototype).not.toHaveProperty('polluted')
  })

  it('ignores unsafe nested path segments without polluting prototypes', () => {
    expect(fromQueryString('safe.__proto__.polluted=yes&safe.constructor.value=no')).toEqual({
      safe: {},
    })
    expect(Object.prototype).not.toHaveProperty('polluted')
    expect(Object.prototype).not.toHaveProperty('value')
  })

  it('ignores unsafe keys in shallow mode too', () => {
    expect(fromQueryString('__proto__=bad&constructor=bad&safe=ok', { deep: false })).toEqual({
      safe: 'ok',
    })
  })
})
