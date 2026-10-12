// The resolved option types are internal. An @internal tag hides a type only in the docs, so this
// test fails the typecheck if the package root exports one of them again.
import { expectTypeOf, it } from 'vitest'

it('does not export the resolved option types from the package root', () => {
  // @ts-expect-error The type is internal.
  expectTypeOf<import('../index').ToQueryStringResolvedOptions>()
  // @ts-expect-error The type is internal.
  expectTypeOf<import('../index').FromQueryStringResolvedOptions>()
})
