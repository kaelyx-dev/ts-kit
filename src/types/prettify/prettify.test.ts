import { describe, expect, expectTypeOf, it } from 'vitest'
import type { Prettify } from './prettify.types'

// expectTypeOf is checked by "npm run typecheck", not at run time.
describe('Prettify', () => {
  it('flattens a complex type', () => {
    type A = { id: number } & { name: string }
    type B = Prettify<A>
    expectTypeOf<B>().toEqualTypeOf<{ id: number; name: string }>()
  })

  it('flattens a nested type', () => {
    type A = { id: number; details: { age: number } }
    type B = Prettify<A>
    expectTypeOf<B>().toEqualTypeOf<{ id: number; details: { age: number } }>()
  })

  it('flattens an intersection of multiple types', () => {
    type A = { id: number } & { name: string } & { age: number }
    type B = Prettify<A>
    expectTypeOf<B>().toEqualTypeOf<{ id: number; name: string; age: number }>()
  })
})
