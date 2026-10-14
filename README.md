# @kaelyx/ts-kit

[![npm version](https://img.shields.io/npm/v/@kaelyx/ts-kit.svg)](https://www.npmjs.com/package/@kaelyx/ts-kit)
[![downloads](https://img.shields.io/npm/dt/@kaelyx/ts-kit.svg)](https://www.npmjs.com/package/@kaelyx/ts-kit)
[![CI](https://github.com/kaelyx-dev/ts-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/kaelyx-dev/ts-kit/actions/workflows/ci.yml)
[![licence: MIT](https://img.shields.io/npm/l/@kaelyx/ts-kit.svg)](https://github.com/kaelyx-dev/ts-kit/blob/main/LICENSE)

Small utility functions for TypeScript.

- **No dependencies at run time.** The package contains only its own code.
- **Import only what you use.** Each function has its own import path, and the package has no side effects.
- **Types included.** Each function has TSDoc, so your editor shows the documentation and examples.
- **ESM only.** See [CommonJS](#commonjs).

**Documentation:** [kaelyx.dev/ts-kit](https://kaelyx.dev/ts-kit/)

## Install

```bash
npm install @kaelyx/ts-kit
```

The package needs Node.js 22 or later.

## Usage

Import a function from the package root, from its category, or from its own path:

```ts
import { truncate } from '@kaelyx/ts-kit' // the package root
import { truncate } from '@kaelyx/ts-kit/string' // the category
import { truncate } from '@kaelyx/ts-kit/string/truncate' // the function only
```

Import types from the package root or from `@kaelyx/ts-kit/types`:

```ts
import type { Result, Prettify } from '@kaelyx/ts-kit/types'
```

### Join two arrays

```ts
import { concatenate } from '@kaelyx/ts-kit/array/concatenate'

concatenate([1, 2], [2, 3]) // [1, 2, 2, 3]
concatenate([1, 2], [2, 3], { unique: true }) // [1, 2, 3]
```

### Shorten a string

`truncate` counts user-visible characters, so it does not split an emoji or an accented letter.

```ts
import { truncate } from '@kaelyx/ts-kit/string/truncate' // the function only

truncate('The quick brown fox', 12, { append: '…' }) // 'The quick b…'
truncate('The quick brown fox', 12, { append: '…', truncateAtWordBoundary: true }) // 'The quick…'
truncate('ab😀cd', 3) // 'ab😀'
```

### Parse JSON without `try`/`catch`

`parseJson` returns a `Result`. Check `ok` to find which property holds the data.

```ts
import { parseJson } from '@kaelyx/ts-kit/string/parse-json'
import { unwrapOr } from '@kaelyx/ts-kit/result/unwrap-or'

const result = parseJson<{ name: string }>('{"name":"Ada"}')

if (result.ok) {
  result.value.name // 'Ada'
} else {
  result.error // SyntaxError
}

unwrapOr(parseJson('not json'), {}) // {}
```

### Write and read query strings

`toQueryString` and `fromQueryString` are inverse functions. The default mode returns strings. JSON mode keeps numbers, booleans and `null`.

```ts
import { toQueryString, fromQueryString } from '@kaelyx/ts-kit/object'

const search = { q: 'shoes', page: 2, filters: { size: 9 }, tags: ['new', 'sale'] }

toQueryString(search) // 'q=shoes&page=2&filters.size=9&tags=new&tags=sale'
fromQueryString('q=shoes&page=2&filters.size=9&tags=new&tags=sale')
// { q: 'shoes', page: '2', filters: { size: '9' }, tags: ['new', 'sale'] }

const query = toQueryString(search, { mode: 'json' })
fromQueryString(query, { mode: 'json' })
// { q: 'shoes', page: 2, filters: { size: 9 }, tags: ['new', 'sale'] }
```

The [query string contract](https://kaelyx.dev/ts-kit/usage/query-strings) gives the full rules and the known limits.

The [roadmap](https://kaelyx.dev/ts-kit/roadmap) lists the functions that we plan to add.

## CommonJS

This package is ESM only. In a CommonJS module, use a dynamic `import()`:

```js
const { truncate } = await import('@kaelyx/ts-kit')
```

## How to contribute

Contributions are welcome. Read [CONTRIBUTING.md](https://github.com/kaelyx-dev/ts-kit/blob/main/CONTRIBUTING.md) and the [AI policy](https://github.com/kaelyx-dev/ts-kit/blob/main/AI-POLICY.md) before you open a pull request.

To see what changed in each release, read the [changelog](https://github.com/kaelyx-dev/ts-kit/blob/main/CHANGELOG.md).

## Licence

[MIT](https://github.com/kaelyx-dev/ts-kit/blob/main/LICENSE)
