# Getting started

`@kaelyx/ts-kit` is a package of small TypeScript utility functions. It has no dependencies at
run time, it publishes ESM only, and one directory holds one function.

## Requirements

- Node.js 22 or later
- npm

## Set up the repository

```bash
git clone https://github.com/kaelyx-dev/ts-kit.git
cd ts-kit
npm install
```

## The three commands you need most

```bash
npm run new -- <category> <name>  # scaffold a new function
npm run test:watch                # run tests as you work
npm run check                     # the one gate: lint, typecheck, barrels, tests, docs, build
```

`npm run check` is the same command CI runs. If it passes locally, it passes in CI.

## Repository layout

```
src/
├─ array/                # a category: one directory per data type
│  ├─ concatenate/       # one directory per function
│  │  ├─ concatenate.ts        # the function, written by hand
│  │  ├─ concatenate.test.ts   # its tests, written by hand
│  │  └─ concatenate.types.ts  # its public types, written by hand
│  └─ index.ts           # a barrel, written by scripts/barrels.ts
├─ types/
│  └─ index.ts           # every public type, written by scripts/barrels.ts
└─ index.ts              # the root barrel, written by scripts/barrels.ts
```

See [Scripts](/guide/scripts) for what each npm script does, and
[Adding a function](/guide/adding-a-function) for the steps to contribute a new function.
