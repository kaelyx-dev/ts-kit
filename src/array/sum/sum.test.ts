import { describe, expect, expectTypeOf, it } from 'vitest'
import { sum } from './sum'
import { type SumKey, SumOptionsMissingBehaviour } from './sum.types'

describe('sum', () => {
  it('adds an array of numbers', () => {
    expect(sum([1, 2, 3])).toBe(6)
  })

  it('returns 0 for an empty array', () => {
    expect(sum([])).toBe(0)
    expect(sum([] as { a: number }[], { key: 'a' })).toBe(0)
  })

  it('adds the value at key for an array of objects', () => {
    const items = [
      { name: 'a', price: 2 },
      { name: 'b', price: 3 },
    ]
    expect(sum(items, { key: 'price' })).toBe(5)
  })

  // These calls are checked by "npm run typecheck". They are not run.
  it('rejects a key that is not a number', () => {
    const items = [{ name: 'a', price: 2, note: undefined as undefined }]
    // @ts-expect-error name is a string
    ;() => sum(items, { key: 'name' })
    // @ts-expect-error note is always undefined
    ;() => sum(items, { key: 'note' })
    // @ts-expect-error missing is not a key
    ;() => sum(items, { key: 'missing' })
    // @ts-expect-error an array of objects needs a key
    ;() => sum(items)
    // @ts-expect-error an array of objects needs a key
    ;() => sum(items, {})
  })

  it('accepts options without a key for an array of numbers', () => {
    expect(sum([1, 2], {})).toBe(3)
    // @ts-expect-error an array of numbers has no keys
    ;() => sum([1, 2], { key: 'a' })
    // @ts-expect-error an array of numbers has no missing values
    ;() => sum([1, 2], { missingBehaviour: SumOptionsMissingBehaviour.zero })
  })

  describe('initialValue', () => {
    it('starts the total from initialValue', () => {
      expect(sum([1, 2], { initialValue: 10 })).toBe(13)
      expect(sum([{ a: 1 }], { key: 'a', initialValue: 10 })).toBe(11)
    })

    it('returns initialValue for an empty array', () => {
      expect(sum([], { initialValue: 5 })).toBe(5)
    })
  })

  describe('missingBehaviour', () => {
    const items: { price?: number }[] = [{ price: 2 }, {}, { price: undefined }, { price: 3 }]

    it('throws by default when an object has no value at key', () => {
      expect(() => sum(items, { key: 'price' })).toThrow(TypeError)
      expect(() => sum(items, { key: 'price' })).toThrow('index 1')
    })

    it('throws with "throw"', () => {
      expect(() =>
        sum(items, { key: 'price', missingBehaviour: SumOptionsMissingBehaviour.throw }),
      ).toThrow(TypeError)
    })

    it('adds 0 for a missing value with "zero"', () => {
      expect(sum(items, { key: 'price', missingBehaviour: SumOptionsMissingBehaviour.zero })).toBe(
        5,
      )
    })
  })

  it('does not change the input array', () => {
    const items = [{ a: 1 }, { a: 2 }]
    sum(items, { key: 'a' })
    expect(items).toEqual([{ a: 1 }, { a: 2 }])
  })
})

// expectTypeOf is checked by "npm run typecheck", not at run time.
describe('SumKey', () => {
  it('gets the number keys, including optional keys', () => {
    expectTypeOf<
      SumKey<{ a: number; b: string; c?: number; d: 1; e: number | undefined; f: undefined }>
    >().toEqualTypeOf<'a' | 'c' | 'd' | 'e'>()
  })
})
