import { describe, expect, it } from 'vitest'
import { toQueryString } from './to-query-string'

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
