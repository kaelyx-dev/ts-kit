import { describe, expect, expectTypeOf, it } from 'vitest'
import type { ValueOf } from './value-of.types'

// expectTypeOf is checked by "npm run typecheck", not at run time.
describe('ValueOf', () => {
  it('accepts a valid value', () => {
    expectTypeOf<ValueOf>().toBeNever()
    expect.fail('write this test')
  })

  it('rejects an invalid value', () => {
    expect.fail('write this test')
  })
})
