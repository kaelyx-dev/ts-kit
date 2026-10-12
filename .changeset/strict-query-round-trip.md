---
"@kaelyx/ts-kit": minor
---

`toQueryString` and `fromQueryString` now round-trip. The contract is on the "Query string contract" docs page. These changes are not backward compatible:

- `fromQueryString` returns strings by default. It does not parse JSON or guess a type. Set `mode: 'json'` in the two functions to keep types. In JSON mode, the encoder writes each value as JSON, strings included.
- This release removes the `parseJson` and `parsePrimitives` options of `fromQueryString`. Use the `mode` option instead.
- Arrays encode as repeated keys (`tags=a&tags=b`) by default. Set `arrayFormat: 'json'` to write one JSON value.
- `fromQueryString` collects two or more equal keys into an array. Before, the last value won. With `arrayFormat: 'json'`, the last value still wins.
- Unsupported values throw a `TypeError` that contains the key path. These values are `NaN`, `Infinity`, `BigInt`, `Map`, `Set`, class instances, functions, symbols, invalid dates, `undefined` array items and circular references. The keys `__proto__`, `prototype` and `constructor` also throw. When `deep` is true, a key that contains `deepSeparator` throws.
- `serialiseLimit` no longer truncates data. The default is now `Infinity`. If the data is deeper than a limit that you set, `toQueryString` throws a `TypeError`. Before, it wrote `[Object]`, `[Array]` or `[Circular]` into the data.
- A `Date` encodes as an ISO string.
- An empty `deepSeparator` throws a `TypeError` in the two functions.
