# @kaelyx/ts-kit

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
