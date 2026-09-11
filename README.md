# @kaelyx/ts-kit


TS-Kit is a small utility library, initially developed by Kaelyx, which aims to make common TypeScript tasks easier and more efficient.

Warning: ESM only package. A CommonJS project must use a dynamic `import()` call


## Homepage

The homepage for TS-Kit can be found at [https://kaelyx.dev/ts-kit/](https://kaelyx.dev/ts-kit/).

## Installation

You can install TS-Kit using npm:

```bash
npm install @kaelyx/ts-kit
```

## Usage

```ts
import { concatenate } from '@kaelyx/ts-kit/array/concatenate'
const result = concatenate([1, 2], [3, 4]) // [1, 2, 3, 4]
const result2 = concatenate([5, 6], [6, 7], { unique: true } ) // [5, 6, 7]
```

