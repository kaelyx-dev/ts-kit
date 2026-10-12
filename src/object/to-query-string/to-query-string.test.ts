import { describe, expect, it } from 'vitest'
import { toQueryString } from './to-query-string'

describe('toQueryString', () => {
  it('handles the normal case', () => {
    expect(toQueryString).toBeTypeOf('function')
  })

  it('returns an empty string for an empty object', () => {
    expect(toQueryString({})).toBe('')
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

  it('flattens nested objects using the default separator', () => {
    expect(toQueryString({ user: { name: 'Ada', active: true } })).toBe(
      'user.name=Ada&user.active=true',
    )
  })

  it('uses a custom separator when flattening nested objects', () => {
    expect(toQueryString({ user: { name: 'Ada' } }, { deepSeparator: '/' })).toBe('user%2Fname=Ada')
  })

  it('serialises nested objects as JSON when deep is false', () => {
    expect(toQueryString({ filters: { status: 'open', page: 2 } }, { deep: false })).toBe(
      'filters=%7B%22status%22%3A%22open%22%2C%22page%22%3A2%7D',
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

  it('truncates nested JSON according to the serialisation limit', () => {
    expect(
      toQueryString(
        { filters: { user: { preferences: { theme: 'dark' } } } },
        { deep: false, serialiseLimit: 2 },
      ),
    ).toBe('filters=%7B%22user%22%3A%7B%22preferences%22%3A%22%5BObject%5D%22%7D%7D')
  })

  it('serialises nested JSON in full when the serialisation limit is infinite', () => {
    const filters = { user: { preferences: { theme: 'dark' } } }
    expect(
      toQueryString({ filters }, { deep: false, serialiseLimit: Number.POSITIVE_INFINITY }),
    ).toBe(new URLSearchParams({ filters: JSON.stringify(filters) }).toString())
  })

  it('replaces circular references when serialising nested JSON', () => {
    const node: Record<string, unknown> = { id: 1 }
    node.self = node
    expect(toQueryString({ node }, { deep: false })).toBe(
      new URLSearchParams({ node: '{"id":1,"self":"[Circular]"}' }).toString(),
    )
  })

  it('truncates nested arrays according to the serialisation limit', () => {
    expect(toQueryString({ filters: { tags: ['a', ['b', ['c']]] } }, { deep: false })).toBe(
      new URLSearchParams({ filters: '{"tags":["a","[Array]"]}' }).toString(),
    )
  })

  it('serialises top-level array values as JSON', () => {
    expect(toQueryString({ tags: ['a', 'b'] })).toBe(
      new URLSearchParams({ tags: '["a","b"]' }).toString(),
    )
  })
})
