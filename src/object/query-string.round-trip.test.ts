// The round-trip contract between toQueryString and fromQueryString. Each test is one row of the
// contract table in docs/guide/query-strings.md, in one mode. Change the table and these tests
// together.
import { describe, expect, it } from 'vitest'
import { fromQueryString } from './from-query-string/from-query-string'
import type { FromQueryStringOptions } from './from-query-string/from-query-string.types'
import { toQueryString } from './to-query-string/to-query-string'
import type { ToQueryStringOptions } from './to-query-string/to-query-string.types'

type Options = ToQueryStringOptions & FromQueryStringOptions

const STRING: Options = {}
const JSON_MODE: Options = { mode: 'json' }

function roundTrip(input: Record<string, unknown>, options: Options): Record<string, unknown> {
  return fromQueryString(toQueryString(input, options), options)
}

/** Round-trip `value` as the value of the key `v`. */
function roundTripValue(value: unknown, options: Options): Record<string, unknown> {
  return roundTrip({ v: value }, options)
}

function expectTypeError(input: Record<string, unknown>, options: Options, path: string): void {
  expect(() => toQueryString(input, options)).toThrow(TypeError)
  expect(() => toQueryString(input, options)).toThrow(`"${path}"`)
}

class Point {
  x = 1
}

const circular = (): Record<string, unknown> => {
  const node: Record<string, unknown> = { id: 1 }
  node.self = node
  return node
}

const unsupported: [string, () => unknown][] = [
  ['NaN', () => Number.NaN],
  ['Infinity', () => Number.POSITIVE_INFINITY],
  ['a BigInt', () => BigInt(1)],
  ['a Map', () => new Map([['a', 1]])],
  ['a Set', () => new Set([1])],
  ['a class instance', () => new Point()],
  ['a function', () => () => 1],
  ['a symbol', () => Symbol('s')],
]

describe.each([
  ['strings-only mode', STRING],
  ['JSON mode', JSON_MODE],
])('in %s, toQueryString rejects', (_mode, options) => {
  it.each(unsupported)('%s with a TypeError that names the key path', (_name, make) => {
    expectTypeError({ filters: { range: make() } }, options, 'filters.range')
  })

  it('a circular reference with a TypeError that names the key path', () => {
    expectTypeError({ filters: { range: circular() } }, options, 'filters.range.self')
  })

  it('a key that contains deepSeparator when deep is true', () => {
    expectTypeError({ 'filters.range': 1 }, options, 'filters.range')
  })

  it.each(['__proto__', 'prototype', 'constructor'])('the key %s', (key) => {
    expectTypeError({ filters: { [key]: 1 } }, options, `filters.${key}`)
  })
})

describe('in strings-only mode, a round trip', () => {
  it('keeps a numeric string as a string', () => {
    expect(roundTripValue('12345', STRING)).toEqual({ v: '12345' })
  })

  it.each(['null', 'true', '{"a":1}'])('keeps the string %s as the same string', (value) => {
    expect(roundTripValue(value, STRING)).toEqual({ v: value })
  })

  it('turns a number into a string', () => {
    expect(roundTripValue(42, STRING)).toEqual({ v: '42' })
  })

  it('turns a boolean into a string', () => {
    expect(roundTripValue(true, STRING)).toEqual({ v: 'true' })
  })

  it('turns null into an empty string', () => {
    expect(roundTripValue(null, STRING)).toEqual({ v: '' })
  })

  it('keeps an empty string', () => {
    expect(roundTripValue('', STRING)).toEqual({ v: '' })
  })

  it('omits an undefined value', () => {
    expect(roundTripValue(undefined, STRING)).not.toHaveProperty('v')
  })

  it('keeps an array of two strings', () => {
    expect(roundTripValue(['a', 'b'], STRING)).toEqual({ v: ['a', 'b'] })
  })

  it('turns an array of one string into that string (known limit)', () => {
    expect(roundTripValue(['a'], STRING)).toEqual({ v: 'a' })
  })

  it('omits an empty array (known limit)', () => {
    expect(roundTripValue([], STRING)).not.toHaveProperty('v')
  })

  it('rejects an array that holds an object', () => {
    expectTypeError({ v: [{ a: 1 }] }, STRING, 'v[0]')
  })

  it('omits an empty object (known limit)', () => {
    expect(roundTripValue({}, STRING)).not.toHaveProperty('v')
  })

  it('keeps nested objects and turns their leaf values into strings', () => {
    expect(roundTrip({ u: { name: 'Ada', age: 3 } }, STRING)).toEqual({
      u: { name: 'Ada', age: '3' },
    })
  })

  it('turns a nested object into a JSON string when deep is false', () => {
    const options: Options = { deep: false }
    expect(roundTrip({ u: { name: 'Ada', age: 3 } }, options)).toEqual({
      u: '{"name":"Ada","age":3}',
    })
  })

  it('turns a date into an ISO string', () => {
    expect(roundTripValue(new Date(0), STRING)).toEqual({ v: '1970-01-01T00:00:00.000Z' })
  })
})

describe('in JSON mode, a round trip', () => {
  it('keeps a numeric string as a string', () => {
    expect(roundTripValue('12345', JSON_MODE)).toEqual({ v: '12345' })
  })

  it.each(['null', 'true', '{"a":1}'])('keeps the string %s as the same string', (value) => {
    expect(roundTripValue(value, JSON_MODE)).toEqual({ v: value })
  })

  it('keeps a number', () => {
    expect(roundTripValue(42, JSON_MODE)).toEqual({ v: 42 })
  })

  it('keeps a boolean', () => {
    expect(roundTripValue(true, JSON_MODE)).toEqual({ v: true })
  })

  it('keeps null', () => {
    expect(roundTripValue(null, JSON_MODE)).toEqual({ v: null })
  })

  it('keeps an empty string', () => {
    expect(roundTripValue('', JSON_MODE)).toEqual({ v: '' })
  })

  it('omits an undefined value', () => {
    expect(roundTripValue(undefined, JSON_MODE)).not.toHaveProperty('v')
  })

  it('keeps an array of two strings', () => {
    expect(roundTripValue(['a', 'b'], JSON_MODE)).toEqual({ v: ['a', 'b'] })
  })

  it('keeps an array of one string', () => {
    expect(roundTripValue(['a'], JSON_MODE)).toEqual({ v: ['a'] })
  })

  it('keeps an empty array', () => {
    expect(roundTripValue([], JSON_MODE)).toEqual({ v: [] })
  })

  it('keeps an array that holds an object', () => {
    expect(roundTripValue([{ a: 1 }], JSON_MODE)).toEqual({ v: [{ a: 1 }] })
  })

  it('keeps an empty object', () => {
    expect(roundTripValue({}, JSON_MODE)).toEqual({ v: {} })
  })

  it('keeps nested objects and the types of their leaf values', () => {
    expect(roundTrip({ u: { name: 'Ada', age: 3 } }, JSON_MODE)).toEqual({
      u: { name: 'Ada', age: 3 },
    })
  })

  it('keeps a nested object when deep is false', () => {
    const options: Options = { mode: 'json', deep: false }
    expect(roundTrip({ u: { name: 'Ada', age: 3 } }, options)).toEqual({
      u: { name: 'Ada', age: 3 },
    })
  })

  it('turns a date into an ISO string', () => {
    expect(roundTripValue(new Date(0), JSON_MODE)).toEqual({ v: '1970-01-01T00:00:00.000Z' })
  })
})
