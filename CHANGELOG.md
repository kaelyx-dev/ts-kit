# @kaelyx/ts-kit

## 0.8.0

### Minor Changes

- 95299c3: **Breaking:** `toQueryString` and `fromQueryString` are now thin wrappers around `URLSearchParams` for flat objects, with no options. `toQueryString` writes an array as repeated keys, `null` as an empty string and a date as an ISO string, and omits `undefined`. `fromQueryString` returns a string for each key, or an array of strings for a repeated key. Nested objects (`deep`, `deepSeparator`, `deepLimit`), JSON mode (`mode`, `arrayFormat`, `serialiseLimit`) and the option types are removed. For nested data, write the value with `JSON.stringify` and put the result in one key. `toQueryString` is now about 0.2 kB gzipped instead of 1.7 kB.

## 0.7.0

### Minor Changes

- 315e81f: Added randomString function that makes cryptographically secure random strings from preset or custom character sets
- 078eb3b: Added Array Sum Function that allows for primitive number arrays and object arrays with keys that are typed to number

### Patch Changes

- 6fc0cbd: Updated readme to include download statistics shield and update the roadmap doc

## 0.6.2

### Patch Changes

- 1cd8b8e: Publish the build output at the package root instead of in `dist/`. Editors that make import paths from file locations (for example, when a project's `paths` maps into `node_modules`) now suggest paths that work, such as `@kaelyx/ts-kit`, instead of `@kaelyx/ts-kit/dist`. The documented import paths do not change.

## 0.6.1

### Patch Changes

- bb75d67: Fix type resolution for consumers using `moduleResolution: "node"` (node10). Subpath imports such as `@kaelyx/ts-kit/number/clamp` now resolve and appear in IntelliSense, instead of auto-import suggesting the unexported `dist/...` path.

## 0.6.0

### Minor Changes

- 871252e: Added clamp number function
- 842daa2: Added Debounce and Debounce with Abort
- 7fc72d3: Added template function which replaces text in a string based on an object of placeholders and values
- 7fc72d3: added withDefaults function that allows for narrow typing option objects in functions to have assigned defaults
- ffe07b3: added Pick and Omit functions to object category, these work closes with the Typescript types Pick and Omit respectivel
- 7fc72d3: Added valueof type to help simplify `as const` enum assignments to types

## 0.5.0

### Minor Changes

- aea1bd5: `toQueryString` and `fromQueryString` now throw a `RangeError` if `deepLimit` is not an integer of 0 or more, or `Infinity`. `toQueryString` also throws a `RangeError` for the same condition in `serialiseLimit`. Before this change, a value such as `1.5` or `-1` was accepted, and the decoder split keys at a different level from the encoder.
- 1ea4b13: `toQueryString` now throws a `TypeError` if an object has an enumerable symbol key. Before this change, `Object.entries` skipped the key, and its data was lost with no error. The message contains the key path, for example `filters.Symbol(s)`. A symbol key that is not enumerable is ignored.
- c1d6a6a: Remove the `ToQueryStringResolvedOptions` and `FromQueryStringResolvedOptions` types from the public API. They were internal types, and the `@internal` tag hid them only in the docs. Use `ToQueryStringOptions` and `FromQueryStringOptions` instead.
- 3ada5cf: Add a `unit` option to `truncate`. Set it to `'codeUnit'` to fit a limit on `.length`, or to `'byte'` to fit a limit in UTF-8 bytes. The default is `'grapheme'`, so the default behaviour does not change. In each unit, the cut is between graphemes, so the result can be shorter than `length`, or empty.

### Patch Changes

- 12b3328: Document how `truncate` counts length. With the default unit, the result can have a `.length` that is more than `length`. The docs now tell you which `unit` to use for each type of limit.
- 5942d7c: `truncate` now reads only the graphemes that it needs. Before this change, it segmented all of the input before the cut, so a long input was slow to truncate. The result does not change.

## 0.4.1

### Patch Changes

- a88174b: Updated readme and documentation on querystring conversions

## 0.4.0

### Minor Changes

- e16e947: Added `toQueryString`, `fromQueryString`, `truncate`, `isJson` and `parseJson`
- e16e947: Changed the default behaviour of `truncate`. These changes are not backward compatible:

  - The default `append` is now `''` in all calls. Before, a call with an options object but no `append` added `'...'`.
  - `includeAppendInLength` is now `true` by default, so the result is never longer than `length`. If the suffix is longer than `length`, the result is the cut text without the suffix. Before, the result was part of the suffix.
  - Lengths are now counted in grapheme clusters, not UTF-16 code units. The function no longer splits an emoji or separates an accent from its letter. The length of `append` is counted in the same way.
  - A `NaN` length now throws a `RangeError`. A non-integer length is rounded down, and an `Infinity` length returns the input.
  - Trailing whitespace is now removed from the cut text, also when there is no suffix: `truncate('hello world', 6)` returns `'hello'`, not `'hello '`.

  `truncateAtWordBoundary` now treats all whitespace (for example tabs and newlines) as a boundary. It keeps the last word when the cut already ends that word, and it uses the hard cut when no boundary exists before the cut.

- e16e947: Added `Result` and `Prettify` types, plus `ok`, `err`, `unwrap` and `unwrapOr` helpers. Types are now exported from the package root
- a74b2a9: `toQueryString` and `fromQueryString` now round-trip. The contract is on the "Query string contract" docs page. These changes are not backward compatible:

  - `fromQueryString` returns strings by default. It does not parse JSON or guess a type. Set `mode: 'json'` in the two functions to keep types. In JSON mode, the encoder writes each value as JSON, strings included.
  - This release removes the `parseJson` and `parsePrimitives` options of `fromQueryString`. Use the `mode` option instead.
  - Arrays encode as repeated keys (`tags=a&tags=b`) by default. Set `arrayFormat: 'json'` to write one JSON value.
  - `fromQueryString` collects two or more equal keys into an array. Before, the last value won. With `arrayFormat: 'json'`, the last value still wins.
  - Unsupported values throw a `TypeError` that contains the key path. These values are `NaN`, `Infinity`, `BigInt`, `Map`, `Set`, class instances, functions, symbols, invalid dates, `undefined` array items and circular references. The keys `__proto__`, `prototype` and `constructor` also throw. When `deep` is true, a key that contains `deepSeparator` throws.
  - `serialiseLimit` no longer truncates data. The default is now `Infinity`. If the data is deeper than a limit that you set, `toQueryString` throws a `TypeError`. Before, it wrote `[Object]`, `[Array]` or `[Circular]` into the data.
  - A `Date` encodes as an ISO string.
  - An empty `deepSeparator` throws a `TypeError` in the two functions.

### Patch Changes

- e16e947: Improved docs readability with inlined types, added a roadmap and a guide for adding types

## 0.3.0

### Minor Changes

- 4c964bd: Updated exports to be clean for using package

### Patch Changes

- 4c964bd: Changed Documentation Generation to use categories as root levels in API Docs

## 0.2.0

### Minor Changes

- 57477a9: Add fullstop, questionmark and exclamationmark string manipulation functions.

### Patch Changes

- 1bb1603: Fix assets-server-by-root error in github pages vitepress docs directory, Fixed the Linter checking package.json
