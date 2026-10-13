import { describe, expect, expectTypeOf, it } from 'vitest'
import { withDefaults } from './with-defaults'

interface Options {
  retries?: number
  timeout?: number | undefined
  name?: string | null
}

describe('withDefaults', () => {
  it('handles the normal case', () => {
    expect(withDefaults).toBeTypeOf('function')
    expect(withDefaults<Options, { retries: number }>({ timeout: 500 }, { retries: 3 })).toEqual({
      retries: 3,
      timeout: 500,
    })
  })

  it('returns a copy of the defaults when the input is undefined', () => {
    const defaults = { retries: 3, timeout: 1000 }
    const result = withDefaults<Options, typeof defaults>(undefined, defaults)
    expect(result).toEqual({ retries: 3, timeout: 1000 })
    expect(result).not.toBe(defaults)
  })

  it('returns a copy of the defaults when the input is an empty object', () => {
    expect(withDefaults<Options, { retries: number }>({}, { retries: 3 })).toEqual({ retries: 3 })
  })

  it('returns an empty object when the input and the defaults are empty', () => {
    expect(withDefaults({}, {})).toEqual({})
  })

  it('uses values from the input in place of the defaults', () => {
    expect(withDefaults<Options, Options>({ retries: 5 }, { retries: 3, timeout: 1000 })).toEqual({
      retries: 5,
      timeout: 1000,
    })
  })

  it('uses the default value when an input value is undefined', () => {
    expect(
      withDefaults<Options, Options>(
        { retries: undefined, timeout: 200 },
        { retries: 3, timeout: 1000 },
      ),
    ).toEqual({ retries: 3, timeout: 200 })
  })

  it('keeps falsy input values that are not undefined', () => {
    expect(
      withDefaults<Options, Options>({ retries: 0, name: null }, { retries: 3, name: 'default' }),
    ).toEqual({ retries: 0, name: null })
    expect(withDefaults<Options, Options>({ name: '' }, { name: 'default' })).toEqual({ name: '' })
  })

  it('keeps input keys that have no default', () => {
    expect(withDefaults<Options, { retries: number }>({ name: 'Ada' }, { retries: 3 })).toEqual({
      retries: 3,
      name: 'Ada',
    })
  })

  it('omits input keys that are undefined and have no default', () => {
    const result = withDefaults<Options, { retries: number }>(
      { timeout: undefined },
      { retries: 3 },
    )
    expect(result).toEqual({ retries: 3 })
    expect(Object.hasOwn(result, 'timeout')).toBe(false)
  })

  it('does not change its arguments', () => {
    const input: Options = { retries: undefined, name: 'Ada' }
    const defaults = { retries: 3, timeout: 1000 }
    const result = withDefaults<Options, typeof defaults>(input, defaults)
    expect(result).not.toBe(input)
    expect(result).not.toBe(defaults)
    expect(input).toEqual({ retries: undefined, name: 'Ada' })
    expect(defaults).toEqual({ retries: 3, timeout: 1000 })
  })

  it('makes keys with a default required and removes undefined from their type', () => {
    const result = withDefaults<Options, { retries: number }>({}, { retries: 3 })
    expectTypeOf(result.retries).toEqualTypeOf<number>()
    expectTypeOf(result.timeout).toEqualTypeOf<number | undefined>()
    expectTypeOf(result.name).toEqualTypeOf<string | null | undefined>()
  })
})
