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

  it('returns every value as a string by default, and does not guess a type', () => {
    expect(fromQueryString('count=42&enabled=true&empty=null&items=%5B1%2C2%5D')).toEqual({
      count: '42',
      enabled: 'true',
      empty: 'null',
      items: '[1,2]',
    })
  })

  it('keeps ordinary strings as strings', () => {
    expect(fromQueryString('name=Ada&code=001&word=falseish')).toEqual({
      name: 'Ada',
      code: '001',
      word: 'falseish',
    })
  })

  it('preserves empty values as empty strings', () => {
    expect(fromQueryString('empty=&also-empty')).toEqual({
      empty: '',
      'also-empty': '',
    })
  })

  it('collects repeated keys into an array by default', () => {
    expect(fromQueryString('tag=first&tag=second&tag=third')).toEqual({
      tag: ['first', 'second', 'third'],
    })
  })

  it('collects repeated deep keys into a nested array', () => {
    expect(fromQueryString('a.b=1&a.b=2')).toEqual({ a: { b: ['1', '2'] } })
  })

  it('gives one string for one key', () => {
    expect(fromQueryString('tag=only')).toEqual({ tag: 'only' })
  })

  it('uses the last value for repeated keys with arrayFormat json', () => {
    expect(fromQueryString('tag=first&tag=second', { arrayFormat: 'json' })).toEqual({
      tag: 'second',
    })
  })

  it('returns a JSON array as a string in strings-only mode with arrayFormat json', () => {
    expect(fromQueryString('tags=%5B%22a%22%5D', { arrayFormat: 'json' })).toEqual({
      tags: '["a"]',
    })
  })

  it('rebuilds nested objects from dotted keys by default', () => {
    expect(fromQueryString('user.name=Ada&user.active=true')).toEqual({
      user: { name: 'Ada', active: 'true' },
    })
  })

  it('supports a custom deep separator', () => {
    expect(fromQueryString('user/name=Ada&user/age=37', { deepSeparator: '/' })).toEqual({
      user: { name: 'Ada', age: '37' },
    })
  })

  it('throws a TypeError for an empty deepSeparator', () => {
    expect(() => fromQueryString('a=1', { deepSeparator: '' })).toThrow(TypeError)
  })

  it('keeps separators in keys when deep parsing is disabled', () => {
    expect(fromQueryString('user.name=Ada&user.age=37', { deep: false })).toEqual({
      'user.name': 'Ada',
      'user.age': '37',
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

  it('splits keys normally when they are within the deep limit', () => {
    expect(fromQueryString('a.b=value', { deepLimit: 5 })).toEqual({ a: { b: 'value' } })
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

  describe('in JSON mode', () => {
    it('parses each value as JSON', () => {
      expect(
        fromQueryString('name=%22Ada%22&count=42&ok=true&none=null&items=%5B1%2C2%5D', {
          mode: 'json',
        }),
      ).toEqual({ name: 'Ada', count: 42, ok: true, none: null, items: [1, 2] })
    })

    it('rebuilds nested objects and parses their leaf values', () => {
      expect(fromQueryString('u.name=%22Ada%22&u.age=3', { mode: 'json' })).toEqual({
        u: { name: 'Ada', age: 3 },
      })
    })

    it('throws a SyntaxError that names the key and keeps the cause', () => {
      const parse = () => fromQueryString('ok=1&u.name=Ada', { mode: 'json' })
      expect(parse).toThrow(SyntaxError)
      expect(parse).toThrow('fromQueryString: the value of "u.name" is not valid JSON.')
      try {
        parse()
      } catch (error) {
        expect((error as Error).cause).toBeInstanceOf(SyntaxError)
      }
    })

    it('throws a SyntaxError for an empty value', () => {
      expect(() => fromQueryString('a=', { mode: 'json' })).toThrow(SyntaxError)
    })

    it('uses the last value for repeated keys by default', () => {
      expect(fromQueryString('v=1&v=2', { mode: 'json' })).toEqual({ v: 2 })
    })

    it('parses each repeated value with arrayFormat repeat', () => {
      expect(
        fromQueryString('v=%22a%22&v=%7B%22b%22%3A1%7D', { mode: 'json', arrayFormat: 'repeat' }),
      ).toEqual({ v: ['a', { b: 1 }] })
    })
  })

  describe('documented examples', () => {
    it('strings-only mode', () => {
      expect(fromQueryString('a=1&b=two')).toEqual({ a: '1', b: 'two' })
      expect(fromQueryString('a.b=1')).toEqual({ a: { b: '1' } })
      expect(fromQueryString('tags=x&tags=y')).toEqual({ tags: ['x', 'y'] })
      expect(fromQueryString('tags=%5B%22x%22%5D', { arrayFormat: 'json' })).toEqual({
        tags: '["x"]',
      })
    })

    it('JSON mode', () => {
      expect(fromQueryString('name=%22Ada%22&age=3', { mode: 'json' })).toEqual({
        name: 'Ada',
        age: 3,
      })
      expect(fromQueryString('tags=%5B%22x%22%5D', { mode: 'json' })).toEqual({ tags: ['x'] })
      expect(
        fromQueryString('tags=%22x%22&tags=%22y%22', { mode: 'json', arrayFormat: 'repeat' }),
      ).toEqual({ tags: ['x', 'y'] })
    })
  })
})
