import { describe, expect, it } from 'vitest'
import { fromQueryString } from '../from-query-string/from-query-string'
import type { FromQueryStringOptions } from '../from-query-string/from-query-string.types'
import { toQueryString } from './to-query-string'
import type { ToQueryStringOptions } from './to-query-string.types'

describe('toQueryString', () => {
  it('handles the normal case', () => {
    expect(toQueryString).toBeTypeOf('function')
  })

  it('returns an empty string for an empty object', () => {
    expect(toQueryString({})).toBe('')
    expect(toQueryString({}, { mode: 'json' })).toBe('')
  })

  it('serialises primitive values, includes null, and omits undefined', () => {
    expect(
      toQueryString({
        text: 'hello world',
        count: 3,
        enabled: false,
        empty: null,
        missing: undefined,
      }),
    ).toBe('text=hello+world&count=3&enabled=false&empty=')
  })

  it('accepts an object with a null prototype', () => {
    const input: Record<string, unknown> = Object.create(null)
    input.a = '1'
    expect(toQueryString(input)).toBe('a=1')
  })

  it('throws a TypeError when the input is not a plain object', () => {
    expect(() => toQueryString(new Map() as unknown as Record<string, unknown>)).toThrow(
      'toQueryString: the input must be a plain object.',
    )
  })

  it('does not change its input', () => {
    const input = { a: { b: [1, 2] }, d: new Date(0) }
    const copy = structuredClone(input)
    toQueryString(input, { mode: 'json' })
    expect(input).toEqual(copy)
  })

  it('flattens nested objects using the default separator', () => {
    expect(toQueryString({ user: { name: 'Ada', active: true } })).toBe(
      'user.name=Ada&user.active=true',
    )
  })

  it('uses a custom separator when flattening nested objects', () => {
    expect(toQueryString({ user: { name: 'Ada' } }, { deepSeparator: '/' })).toBe('user%2Fname=Ada')
  })

  it('throws a TypeError for an empty deepSeparator', () => {
    expect(() => toQueryString({ a: 1 }, { deepSeparator: '' })).toThrow(TypeError)
  })

  it('throws a RangeError for a deepLimit that is not an integer', () => {
    // The decoder cannot split a key at 1.5 levels, so this value must not encode.
    expect(() => toQueryString({ a: { b: { c: 1 } } }, { deepLimit: 1.5 })).toThrow(
      new RangeError(
        'toQueryString: deepLimit must be an integer of 0 or more, or Infinity. Received 1.5.',
      ),
    )
  })

  it.each([1.5, -1, Number.NaN, Number.NEGATIVE_INFINITY])(
    'throws a RangeError for deepLimit %s',
    (deepLimit) => {
      expect(() => toQueryString({ a: 1 }, { deepLimit })).toThrow(RangeError)
      expect(() => toQueryString({ a: 1 }, { deepLimit })).toThrow(`Received ${deepLimit}.`)
    },
  )

  it.each([0, 2, Number.POSITIVE_INFINITY])('accepts deepLimit %s', (deepLimit) => {
    expect(toQueryString({ a: 1 }, { deepLimit })).toBe('a=1')
  })

  it.each([1.5, -1, Number.NaN, Number.NEGATIVE_INFINITY])(
    'throws a RangeError for serialiseLimit %s',
    (serialiseLimit) => {
      const message = `toQueryString: serialiseLimit must be an integer of 0 or more, or Infinity. Received ${serialiseLimit}.`
      expect(() => toQueryString({ a: 1 }, { serialiseLimit })).toThrow(RangeError)
      expect(() => toQueryString({ a: 1 }, { serialiseLimit })).toThrow(new RangeError(message))
      expect(() => toQueryString({ a: 1 }, { deep: false, serialiseLimit })).toThrow(
        new RangeError(message),
      )
    },
  )

  it.each([0, 2, Number.POSITIVE_INFINITY])('accepts serialiseLimit %s', (serialiseLimit) => {
    expect(toQueryString({ a: 1 }, { serialiseLimit })).toBe('a=1')
    expect(toQueryString({ a: 1 }, { deep: false, serialiseLimit })).toBe('a=1')
  })

  it('keeps an empty top-level key as a key segment', () => {
    expect(toQueryString({ '': { a: '1' } })).toBe('.a=1')
  })

  it('allows a key that contains the separator when deep is false', () => {
    expect(toQueryString({ 'a.b': '1' }, { deep: false })).toBe('a.b=1')
  })

  it('allows a key that contains the separator inside a value written as JSON', () => {
    expect(toQueryString({ a: { 'b.c': 1 } }, { deep: false })).toBe(
      new URLSearchParams({ a: '{"b.c":1}' }).toString(),
    )
  })

  it('rejects an unsafe key inside a value written as JSON', () => {
    expect(() => toQueryString({ a: { b: { ['__proto__']: 1 } } }, { deep: false })).toThrow(
      '"a.b.__proto__"',
    )
  })

  it('serialises nested objects as JSON when deep is false', () => {
    expect(toQueryString({ filters: { status: 'open', page: 2 } }, { deep: false })).toBe(
      'filters=%7B%22status%22%3A%22open%22%2C%22page%22%3A2%7D',
    )
  })

  it('omits an undefined property inside a value written as JSON', () => {
    expect(toQueryString({ a: { b: undefined, c: 1 } }, { deep: false })).toBe(
      new URLSearchParams({ a: '{"c":1}' }).toString(),
    )
  })

  it('omits nested objects when shallow serialisation is disabled', () => {
    expect(
      toQueryString(
        { filters: { status: 'open' }, page: 2 },
        { deep: false, serialiseOnShallow: false },
      ),
    ).toBe('page=2')
  })

  it('serialises nested objects when the deep limit is reached', () => {
    expect(toQueryString({ account: { profile: { name: 'Ada' } } }, { deepLimit: 1 })).toBe(
      'account.profile=%7B%22name%22%3A%22Ada%22%7D',
    )
  })

  it('omits nested objects beyond the deep limit when configured', () => {
    expect(
      toQueryString(
        { account: { profile: { name: 'Ada' } } },
        { deepLimit: 1, serialiseOnDeepLimitExceeded: false },
      ),
    ).toBe('')
  })

  it('serialises nested JSON in full by default', () => {
    const filters = { user: { preferences: { theme: 'dark', tags: ['a', ['b', ['c']]] } } }
    expect(toQueryString({ filters }, { deep: false })).toBe(
      new URLSearchParams({ filters: JSON.stringify(filters) }).toString(),
    )
  })

  it('throws a TypeError, and does not truncate, when JSON is deeper than serialiseLimit', () => {
    const input = { filters: { user: { preferences: { theme: 'dark' } } } }
    expect(() => toQueryString(input, { deep: false, serialiseLimit: 2 })).toThrow(
      'toQueryString: the value is deeper than serialiseLimit (2) at "filters.user.preferences".',
    )
    expect(() =>
      toQueryString({ filters: { tags: ['a', ['b']] } }, { deep: false, serialiseLimit: 2 }),
    ).toThrow('"filters.tags[1]"')
  })

  it('writes JSON that is exactly serialiseLimit levels deep', () => {
    expect(toQueryString({ a: { b: { c: 1 } } }, { deepLimit: 0, serialiseLimit: 2 })).toBe(
      new URLSearchParams({ a: '{"b":{"c":1}}' }).toString(),
    )
  })

  it('throws a TypeError for a circular reference in JSON and names the path', () => {
    const node: Record<string, unknown> = { id: 1 }
    node.self = node
    expect(() => toQueryString({ node }, { deep: false })).toThrow(
      'toQueryString: the value has a circular reference at "node.self".',
    )
  })

  it('throws a TypeError for an array that contains itself', () => {
    const list: unknown[] = ['a']
    list.push(list)
    expect(() => toQueryString({ list }, { mode: 'json', arrayFormat: 'repeat' })).toThrow(
      '"list[1]"',
    )
    expect(() => toQueryString({ list }, { mode: 'json' })).toThrow('"list[1]"')
  })

  it('allows the same object in two places when neither contains the other', () => {
    const shared = { a: '1' }
    expect(toQueryString({ x: shared, y: shared })).toBe('x.a=1&y.a=1')
    expect(toQueryString({ list: [shared, shared] }, { mode: 'json' })).toBe(
      new URLSearchParams({ list: '[{"a":"1"},{"a":"1"}]' }).toString(),
    )
  })

  it('writes a date as an ISO string', () => {
    expect(toQueryString({ at: new Date(0) })).toBe('at=1970-01-01T00%3A00%3A00.000Z')
    expect(toQueryString({ at: [new Date(0), new Date(1)] }, { arrayFormat: 'json' })).toBe(
      new URLSearchParams({
        at: '["1970-01-01T00:00:00.000Z","1970-01-01T00:00:00.001Z"]',
      }).toString(),
    )
  })

  it('throws a TypeError for an invalid date', () => {
    expect(() => toQueryString({ at: new Date(Number.NaN) })).toThrow(
      'toQueryString: the date is invalid at "at".',
    )
  })

  it('names the type of an unsupported value in the message', () => {
    expect(() => toQueryString({ a: new Map() })).toThrow('a value of type Map is not supported')
    expect(() => toQueryString({ a: BigInt(1) })).toThrow('a value of type bigint is not supported')
    expect(() => toQueryString({ a: Object.create(Object.create(null)) })).toThrow(
      'a value of type object is not supported',
    )
  })

  it('throws a TypeError for -Infinity', () => {
    expect(() => toQueryString({ a: Number.NEGATIVE_INFINITY })).toThrow(
      '-Infinity is not a finite number',
    )
  })

  describe('in strings-only mode', () => {
    it('writes a top-level array as repeated keys by default', () => {
      expect(toQueryString({ tags: ['a', 'b'] })).toBe('tags=a&tags=b')
    })

    it('writes a nested array as repeated deep keys', () => {
      expect(toQueryString({ a: { b: ['1', '2'] } })).toBe('a.b=1&a.b=2')
    })

    it('writes each item of an array as text, with null as an empty string', () => {
      expect(toQueryString({ v: [1, true, null] })).toBe('v=1&v=true&v=')
    })

    it('writes an array as one JSON value with arrayFormat json', () => {
      expect(toQueryString({ tags: ['a', 'b'] }, { arrayFormat: 'json' })).toBe(
        new URLSearchParams({ tags: '["a","b"]' }).toString(),
      )
    })

    it('rejects an array that holds an array, and suggests JSON mode', () => {
      expect(() => toQueryString({ v: [['a']] })).toThrow("Use mode: 'json'")
    })

    it('rejects an undefined item and a hole in an array', () => {
      expect(() => toQueryString({ v: ['a', undefined] })).toThrow(
        'toQueryString: an array item is undefined at "v[1]".',
      )
      // biome-ignore lint/suspicious/noSparseArray: the hole is the subject of the test
      expect(() => toQueryString({ v: ['a', , 'b'] })).toThrow('"v[1]"')
      expect(() => toQueryString({ v: ['a', undefined] }, { arrayFormat: 'json' })).toThrow(
        '"v[1]"',
      )
    })

    it('omits an empty nested object', () => {
      expect(toQueryString({ a: {}, b: '1' })).toBe('b=1')
    })
  })

  describe('in JSON mode', () => {
    it('writes each leaf value as JSON, strings included', () => {
      expect(toQueryString({ name: 'Ada', age: 3, ok: true, none: null }, { mode: 'json' })).toBe(
        'name=%22Ada%22&age=3&ok=true&none=null',
      )
    })

    it('flattens nested objects and writes the leaf values as JSON', () => {
      expect(toQueryString({ u: { name: 'Ada' } }, { mode: 'json' })).toBe('u.name=%22Ada%22')
    })

    it('writes an empty object as {} and an empty array as []', () => {
      expect(toQueryString({ o: {}, a: [] }, { mode: 'json' })).toBe('o=%7B%7D&a=%5B%5D')
    })

    it('writes an array as one JSON value by default', () => {
      expect(toQueryString({ v: [{ a: 1 }] }, { mode: 'json' })).toBe(
        new URLSearchParams({ v: '[{"a":1}]' }).toString(),
      )
    })

    it('writes each item as JSON with arrayFormat repeat', () => {
      expect(toQueryString({ v: ['a', { b: 1 }] }, { mode: 'json', arrayFormat: 'repeat' })).toBe(
        new URLSearchParams([
          ['v', '"a"'],
          ['v', '{"b":1}'],
        ]).toString(),
      )
    })

    it('rejects an undefined item with arrayFormat repeat', () => {
      expect(() =>
        toQueryString({ v: [undefined] }, { mode: 'json', arrayFormat: 'repeat' }),
      ).toThrow('"v[0]"')
    })

    it('writes a nested object as one JSON value when deep is false', () => {
      expect(toQueryString({ u: { name: 'Ada' } }, { mode: 'json', deep: false })).toBe(
        new URLSearchParams({ u: '{"name":"Ada"}' }).toString(),
      )
    })
  })

  describe('documented examples', () => {
    it('strings-only mode', () => {
      expect(toQueryString({ a: 1, b: 'two' })).toBe('a=1&b=two')
      expect(toQueryString({ a: { b: 1 } })).toBe('a.b=1')
      expect(toQueryString({ tags: ['x', 'y'] })).toBe('tags=x&tags=y')
      expect(toQueryString({ tags: ['x', 'y'] }, { arrayFormat: 'json' })).toBe(
        'tags=%5B%22x%22%2C%22y%22%5D',
      )
      expect(toQueryString({ a: { b: 1 } }, { deep: false })).toBe('a=%7B%22b%22%3A1%7D')
      expect(toQueryString({ a: { b: { c: 1 } } }, { deepLimit: 1 })).toBe('a.b=%7B%22c%22%3A1%7D')
    })

    it('JSON mode', () => {
      expect(toQueryString({ name: 'Ada', age: 3 }, { mode: 'json' })).toBe('name=%22Ada%22&age=3')
      expect(toQueryString({ tags: ['x'] }, { mode: 'json' })).toBe('tags=%5B%22x%22%5D')
      expect(toQueryString({ tags: ['x', 'y'] }, { mode: 'json', arrayFormat: 'repeat' })).toBe(
        'tags=%22x%22&tags=%22y%22',
      )
    })
  })
})

// The round-trip contract between toQueryString and fromQueryString. Each test is one row of the
// contract table in docs/usage/query-strings.md, in one mode. Change the table and these tests
// together.

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
