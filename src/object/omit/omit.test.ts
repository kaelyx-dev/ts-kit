import { describe, expect, it } from 'vitest'
import { omit } from './omit'

describe('omit', () => {
  it('omits the specified keys from the object', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ b: 2 })
  })

  it('returns a shallow copy when no keys are specified', () => {
    const obj = { a: 1, b: 2 }
    const result = omit(obj, [])
    expect(result).toEqual(obj)
    expect(result).not.toBe(obj)
  })

  it('returns an empty object for an empty input', () => {
    const obj: { a?: number } = {}
    expect(omit(obj, ['a'])).toEqual({})
  })

  it('ignores keys that are not present in the object', () => {
    const obj: { a: number; b?: number } = { a: 1 }
    expect(omit(obj, ['b'])).toEqual({ a: 1 })
  })

  it('removes keys that are present with an undefined value', () => {
    const obj: { a: number; b: number | undefined } = { a: 1, b: undefined }
    const result = omit(obj, ['b'])
    expect(result).toEqual({ a: 1 })
    expect('b' in result).toBe(false)
  })

  it('omits symbol and numeric keys', () => {
    const sym = Symbol('sym')
    const obj = { [sym]: 'symbol', 1: 'one', a: 'a' }
    const result = omit(obj, [sym, 1])
    expect(result).toEqual({ a: 'a' })
    expect(Object.getOwnPropertySymbols(result)).toEqual([])
  })

  it('keeps symbol keys that are not omitted', () => {
    const sym = Symbol('sym')
    const obj = { [sym]: 'symbol', a: 'a' }
    expect(omit(obj, ['a'])).toEqual({ [sym]: 'symbol' })
  })

  it('does not copy inherited properties', () => {
    const proto = { inherited: 'yes' }
    const obj: { own: string; inherited: string } = Object.create(proto)
    obj.own = 'own'
    const result = omit(obj, [])
    expect(result).toEqual({ own: 'own' })
    expect('inherited' in result).toBe(false)
  })

  it('does not copy non-enumerable properties', () => {
    const obj: { a: number; hidden?: string } = { a: 1 }
    Object.defineProperty(obj, 'hidden', { value: 'secret', enumerable: false })
    const result = omit(obj, [])
    expect(result).toEqual({ a: 1 })
    expect(Object.hasOwn(result, 'hidden')).toBe(false)
  })

  it('does not copy class getters or methods', () => {
    class User {
      constructor(
        public first: string,
        public last: string,
      ) {}

      get fullName() {
        return `${this.first} ${this.last}`
      }

      greet() {
        return `Hello, ${this.first}`
      }
    }
    const result = omit(new User('Ada', 'Lovelace'), ['last'])
    expect(result).toEqual({ first: 'Ada' })
    expect('fullName' in result).toBe(false)
    expect('greet' in result).toBe(false)
  })

  it('copies the current value of own getters', () => {
    let count = 1
    const obj = {
      a: 1,
      get count() {
        return count
      },
    }
    const result = omit(obj, ['a'])
    count = 2
    expect(result).toEqual({ count: 1 })
    expect(Object.getOwnPropertyDescriptor(result, 'count')?.get).toBeUndefined()
  })

  it('matches the object produced by a rest pattern', () => {
    const sym = Symbol('sym')
    const proto = { inherited: 'yes' }
    const obj: { a: number; b: number; [sym]: string } = Object.create(proto)
    obj.a = 1
    obj.b = 2
    obj[sym] = 'symbol'
    const { a: _a, ...rest } = obj
    expect(omit(obj, ['a'])).toEqual(rest)
  })

  it('handles duplicate keys', () => {
    expect(omit({ a: 1, b: 2 }, ['a', 'a'])).toEqual({ b: 2 })
  })

  it('accepts a readonly keys array', () => {
    const keys = ['a'] as const
    expect(omit({ a: 1, b: 2 }, keys)).toEqual({ b: 2 })
  })

  it('returns a new object without mutating the input', () => {
    const nested = { x: 1 }
    const obj = { a: nested, b: 2 }
    const result = omit(obj, ['b'])
    expect(result).not.toBe(obj)
    expect(obj).toEqual({ a: nested, b: 2 })
    expect(result.a).toBe(nested)
  })
})
