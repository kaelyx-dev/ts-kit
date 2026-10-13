import { describe, expect, it } from 'vitest'
import { pick } from './pick'

describe('pick', () => {
  it('picks the specified keys from the object', () => {
    const obj = { a: 1, b: 2, c: 3 }
    expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 })
  })

  it('returns an empty object when no keys are specified', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, [])).toEqual({})
  })

  it('returns an empty object for an empty input', () => {
    const obj: { a?: number } = {}
    expect(pick(obj, ['a'])).toEqual({})
  })

  it('ignores keys that are not present in the object', () => {
    const obj: { a: number; b?: number } = { a: 1 }
    const result = pick(obj, ['a', 'b'])
    expect(result).toEqual({ a: 1 })
    expect('b' in result).toBe(false)
  })

  it('keeps keys that are present with an undefined value', () => {
    const obj: { a: number; b: number | undefined } = { a: 1, b: undefined }
    const result = pick(obj, ['b'])
    expect(result).toEqual({ b: undefined })
    expect('b' in result).toBe(true)
  })

  it('picks symbol and numeric keys', () => {
    const sym = Symbol('sym')
    const obj = { [sym]: 'symbol', 1: 'one', a: 'a' }
    expect(pick(obj, [sym, 1])).toEqual({ [sym]: 'symbol', 1: 'one' })
  })

  it('picks inherited properties', () => {
    const proto = { inherited: 'yes' }
    const obj: { own: string; inherited: string } = Object.create(proto)
    obj.own = 'own'
    const result = pick(obj, ['own', 'inherited'])
    expect(result).toEqual({ own: 'own', inherited: 'yes' })
    expect(Object.hasOwn(result, 'inherited')).toBe(true)
  })

  it('picks Object.prototype members when the type declares them', () => {
    const obj: { a: number; toString(): string } = { a: 1 }
    const result = pick(obj, ['toString'])
    expect(Object.hasOwn(result, 'toString')).toBe(true)
    expect(result.toString).toBe(Object.prototype.toString)
  })

  it('picks non-enumerable properties', () => {
    const obj: { a: number; hidden?: string } = { a: 1 }
    Object.defineProperty(obj, 'hidden', { value: 'secret', enumerable: false })
    const result = pick(obj, ['a', 'hidden'])
    expect(result).toEqual({ a: 1, hidden: 'secret' })
    expect(Object.getOwnPropertyDescriptor(result, 'hidden')?.enumerable).toBe(true)
  })

  it('picks class getters and copies their current value', () => {
    class User {
      constructor(
        public first: string,
        public last: string,
      ) {}

      get fullName() {
        return `${this.first} ${this.last}`
      }
    }
    const user = new User('Ada', 'Lovelace')
    const result = pick(user, ['fullName'])
    expect(result).toEqual({ fullName: 'Ada Lovelace' })
    user.first = 'Grace'
    expect(result.fullName).toBe('Ada Lovelace')
  })

  it('matches the values read by destructuring', () => {
    const proto = { inherited: 'yes' }
    const obj: { own: string; inherited: string } = Object.create(proto)
    obj.own = 'own'
    const { own, inherited } = obj
    expect(pick(obj, ['own', 'inherited'])).toEqual({ own, inherited })
  })

  it('accepts a readonly keys array', () => {
    const keys = ['a'] as const
    expect(pick({ a: 1, b: 2 }, keys)).toEqual({ a: 1 })
  })

  it('handles duplicate keys', () => {
    expect(pick({ a: 1, b: 2 }, ['a', 'a'])).toEqual({ a: 1 })
  })

  it('returns a new object without mutating the input', () => {
    const nested = { x: 1 }
    const obj = { a: nested, b: 2 }
    const result = pick(obj, ['a', 'b'])
    expect(result).not.toBe(obj)
    expect(obj).toEqual({ a: nested, b: 2 })
    expect(result.a).toBe(nested)
  })
})
