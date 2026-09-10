# @kaelyx/ts-kit

A TypeScript utility library. ESM only. A CommonJS project must use a dynamic `import()` call.

Small functions, one per directory. No dependencies at run time. Each function documents its own
behaviour in its TSDoc block.

## Everyday commands

```bash
npm run new -- <category> <name>  # scaffold a new function
npm run test:watch                # run tests as you work
npm run check                     # the one gate: lint, typecheck, barrels, tests, docs, build
```

## Usage

```ts
import { concatenate } from '@kaelyx/ts-kit/array/concatenate'
import type { ConcatenateOptions } from '@kaelyx/ts-kit/array/concatenate'

// or, for many types at one time, from one path
import type { ConcatenateOptions } from '@kaelyx/ts-kit/types'
```

## Structure

One function has one directory. One directory has one function. Every function directory has
three files: `<name>.ts` (the function), `<name>.test.ts` (its tests) and `<name>.types.ts` (its
public types). The `index.ts` barrel files are written by `scripts/barrels.ts`, never by hand.

See the categories in `src/` for the available functions, grouped by data type (`array`, `object`,
`string`, and so on).

## Documentation

The full developer guide and the generated API reference live in `docs/`, built with VitePress:

```bash
npm run docs:dev    # serve the docs site locally, with the API pages regenerated from TSDoc
npm run docs:build  # build the static site into docs/.vitepress/dist
```
