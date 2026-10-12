# Adding a type

Most types belong to a function and live in that function's `<name>.types.ts` (see
[Adding a function](/guide/adding-a-function)). A standalone type is for a type that is useful
on its own, or that more than one function needs, such as `JsonValue`.

One standalone type has one directory under `src/types`. Follow these steps to add one.

## 1. Choose a name

The name is kebab-case and describes the type, for example `json-value`. It must not already be
used by another standalone type or by any function, because both share the same type-name
prefix.

## 2. Run the scaffold command

```bash
npm run new -- type <name>
```

For example:

```bash
npm run new -- type json-value
```

This:

1. Checks that `<name>` is kebab-case and not already used by a type or a function.
2. Creates `src/types/<name>/` with two stub files. The test deliberately fails.
3. Runs `scripts/barrels.ts`, which adds the type to `src/types/index.ts` and, through it, to the
   root barrel.

If you omit the arguments, the script asks for them interactively.

```
src/types/
├─ index.ts                   # written by scripts/barrels.ts, never by hand
└─ json-value/
   ├─ json-value.types.ts     # the type, written by hand
   └─ json-value.test.ts      # its type tests, written by hand
```

## 3. Write the type

Fill in `<name>.types.ts`. Every exported type name must start with the PascalCase form of the
directory name (for example, `JsonValue` or `JsonValueObject` for `json-value`).
`scripts/barrels.ts` checks this and stops with an error if a name does not match or is exported
twice anywhere in the package.

Every exported type needs one TSDoc block with a summary, an `@example`, and `@category types`.
`npm run docs:check` reports a type without one.

## 4. Write the tests

Fill in `<name>.test.ts` with `expectTypeOf` assertions from Vitest. These are checked by
`npm run typecheck`, not when the tests run, so a wrong assertion fails `npm run check` at the
typecheck step. At minimum, write:

- One test that a valid value is accepted.
- One test that an invalid value is rejected, with `.not`.
- One test for each edge case the type is meant to handle.

Remove the `expect.fail` lines once the real assertions are in place. Check that a test fails if
you break the type on purpose.

```ts
import { describe, expectTypeOf, it } from 'vitest'
import type { JsonValue } from './json-value.types'

describe('JsonValue', () => {
  it('accepts a valid value', () => {
    expectTypeOf({ a: [1, 'b', null] }).toMatchTypeOf<JsonValue>()
  })

  it('rejects an invalid value', () => {
    expectTypeOf(undefined).not.toMatchTypeOf<JsonValue>()
  })
})
```

## 5. Use the type

Consumers import it from the package root or from the types subpath:

```ts
import type { JsonValue } from '@kaelyx/ts-kit'
import type { JsonValue } from '@kaelyx/ts-kit/types'
```

Inside `src`, a function imports it from the type's file:

```ts
import type { JsonValue } from '../../types/json-value/json-value.types'
```

## 6. Check your work

```bash
npm run check
```

## 7. Add a changeset

A new public type is a new feature, so add a changeset:

```bash
npx changeset
```

See [Changesets and releases](/guide/changesets-and-releases) for what happens next.
