import { describe, expectTypeOf, it } from 'vitest'
import type { ValueOf } from './value-of.types'

// expectTypeOf is checked by "npm run typecheck", not at run time.
describe('ValueOf', () => {
  it('gets the values of an object', () => {
    const obj = { a: 1, b: 'two' } as const
    expectTypeOf<ValueOf<typeof obj>>().toEqualTypeOf<1 | 'two'>()
    expectTypeOf<ValueOf<{ a: number; b: string }>>().toEqualTypeOf<number | string>()
  })

  it('gets the elements of an array or tuple', () => {
    expectTypeOf<ValueOf<string[]>>().toEqualTypeOf<string>()
    expectTypeOf<ValueOf<readonly ['a', 'b']>>().toEqualTypeOf<'a' | 'b'>()
  })

  it('includes undefined for optional keys', () => {
    expectTypeOf<ValueOf<{ a?: number }>>().toEqualTypeOf<number | undefined>()
  })

  it('is never for an empty object or tuple', () => {
    // biome-ignore lint/complexity/noBannedTypes: an empty object type is the case under test
    expectTypeOf<ValueOf<{}>>().toBeNever()
    expectTypeOf<ValueOf<[]>>().toBeNever()
  })

  it('rejects a value that is not in the object', () => {
    const obj = { a: 1, b: 2 } as const
    expectTypeOf<3>().not.toExtend<ValueOf<typeof obj>>()
  })
})
