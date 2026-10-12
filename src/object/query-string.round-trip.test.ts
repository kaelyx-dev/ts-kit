// The round-trip contract between toQueryString and fromQueryString. Each test is one row of the
// contract table in docs/usage/query-strings.md, in one mode. Change the table and these tests
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

/** A copy of `properties` with a symbol key that is not enumerable. */
const withHiddenSymbol = (properties: Record<string, unknown>): Record<string, unknown> => {
  const object = { ...properties }
  Object.defineProperty(object, Symbol('s'), { value: 1, enumerable: false })
  return object
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

  it('a symbol key, which Object.entries would skip', () => {
    expectTypeError({ [Symbol('s')]: 1, a: 1 }, options, 'Symbol(s)')
  })

  it('a symbol key in a nested object, with a TypeError that names the key path', () => {
    expectTypeError({ filters: { [Symbol('s')]: 1 } }, options, 'filters.Symbol(s)')
  })

  it('a symbol key in a nested object that is written as JSON', () => {
    const shallow: Options = { ...options, deep: false }
    expectTypeError({ filters: { [Symbol('s')]: 1 } }, shallow, 'filters.Symbol(s)')
  })
})

describe.each([
  ['strings-only mode', STRING],
  ['JSON mode', JSON_MODE],
])('in %s, toQueryString ignores', (_mode, options) => {
  it('a symbol key that is not enumerable', () => {
    const input = withHiddenSymbol({ a: 1, filters: withHiddenSymbol({ a: 1 }) })
    expect(toQueryString(input, options)).toBe(toQueryString({ a: 1, filters: { a: 1 } }, options))
  })

  it('a symbol key that is not enumerable, in a nested object that is written as JSON', () => {
    const shallow: Options = { ...options, deep: false }
    expect(toQueryString({ filters: withHiddenSymbol({ a: 1 }) }, shallow)).toBe(
      toQueryString({ filters: { a: 1 } }, shallow),
    )
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

// A fault that occurs only with some nesting options is not found by the rows above, which use
// the default options. These rows repeat a round trip for each combination of deep, deepSeparator
// and deepLimit.

const JSON_FIXTURE = {
  name: 'Ada',
  age: 36,
  active: true,
  manager: null,
  settings: {},
  tags: [],
  teams: [{ id: 1 }, { id: 2, lead: 'Bob' }],
  profile: {
    city: 'London',
    score: 1.5,
    address: {
      verified: false,
      note: null,
      extra: {},
      codes: [],
      geo: { lat: 51.5, label: 'home', pins: [{ x: 1 }] },
    },
  },
}

const STRINGS_FIXTURE = {
  name: 'Ada',
  tags: ['x', 'y'],
  profile: {
    city: 'London',
    aliases: ['A', 'B'],
    address: {
      street: 'Main',
      geo: { lat: '51.5', pins: ['p', 'q'] },
    },
  },
}

/**
 * The result of a strings-only round trip of STRINGS_FIXTURE, by the number of levels of nested
 * objects that become keys. A nested object below those levels comes back as its JSON text.
 */
const STRINGS_EXPECTED = new Map<number, Record<string, unknown>>([
  [
    0,
    {
      name: 'Ada',
      tags: ['x', 'y'],
      profile:
        '{"city":"London","aliases":["A","B"],"address":{"street":"Main","geo":{"lat":"51.5","pins":["p","q"]}}}',
    },
  ],
  [
    1,
    {
      name: 'Ada',
      tags: ['x', 'y'],
      profile: {
        city: 'London',
        aliases: ['A', 'B'],
        address: '{"street":"Main","geo":{"lat":"51.5","pins":["p","q"]}}',
      },
    },
  ],
  [
    2,
    {
      name: 'Ada',
      tags: ['x', 'y'],
      profile: {
        city: 'London',
        aliases: ['A', 'B'],
        address: { street: 'Main', geo: '{"lat":"51.5","pins":["p","q"]}' },
      },
    },
  ],
  [Number.POSITIVE_INFINITY, STRINGS_FIXTURE],
])

const DEEP_SEPARATORS = ['.', '/', '__']
const DEEP_LIMITS = [0, 1, 2, Number.POSITIVE_INFINITY]

const NESTING_COMBINATIONS: [label: string, options: Options, flattenedLevels: number][] = [
  ['deep: false', { deep: false }, 0],
  ...DEEP_SEPARATORS.flatMap((deepSeparator) =>
    DEEP_LIMITS.map((deepLimit): [string, Options, number] => [
      `deep: true, deepSeparator: '${deepSeparator}', deepLimit: ${deepLimit}`,
      { deep: true, deepSeparator, deepLimit },
      deepLimit,
    ]),
  ),
]

describe.each(NESTING_COMBINATIONS)('with %s, a round trip', (_label, nesting, flattenedLevels) => {
  it("in JSON mode with arrayFormat: 'json' gives the input back", () => {
    const options: Options = { ...nesting, mode: 'json', arrayFormat: 'json' }
    expect(roundTrip(JSON_FIXTURE, options)).toEqual(JSON_FIXTURE)
  })

  it("in strings-only mode with arrayFormat: 'repeat' turns objects below deepLimit into JSON text", () => {
    const options: Options = { ...nesting, mode: 'string', arrayFormat: 'repeat' }
    expect(roundTrip(STRINGS_FIXTURE, options)).toEqual(STRINGS_EXPECTED.get(flattenedLevels))
  })
})
