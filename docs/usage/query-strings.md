# Query string contract

`toQueryString` and `fromQueryString` are inverse functions. With the same options, this is true:

```ts
fromQueryString(toQueryString(value, options), options) // equals value, within this contract
```

This page is the specification. Each row of the table has a test in each mode, in
`src/object/query-string.round-trip.test.ts`. If you change a row, change its tests.

## Modes

Set the mode with the `mode` option. Use the same mode in the two functions.

| Mode | Option | What the decoder returns |
| --- | --- | --- |
| Strings-only (default) | `mode: 'string'` | Each value is a string, or an array of strings. The keys give all of the structure. The decoder does not guess a type. |
| JSON | `mode: 'json'` | Each value is parsed as JSON. The encoder writes each leaf value as JSON, strings included: `name=%22Ada%22`. |

## Array formats

Set the array format with the `arrayFormat` option.

| Format | Default in | Encoder | Decoder |
| --- | --- | --- | --- |
| `'repeat'` | Strings-only mode | Writes one key for each item: `tags=a&tags=b` | Collects two or more equal keys into an array. One key gives one value. This also applies to deep keys: `a.b=1&a.b=2` gives `{ a: { b: ['1', '2'] } }`. |
| `'json'` | JSON mode | Writes the array as one JSON value | In JSON mode, parses the array. In strings-only mode, returns the JSON text as a string. If a key occurs two or more times, the last value wins. |

## The contract

The input is the value of one key. "Key omitted" means that the key is not in the result.

| Input value | Strings-only mode result | JSON mode result |
| --- | --- | --- |
| `'12345'` | `'12345'` | `'12345'` |
| `'null'`, `'true'`, `'{"a":1}'` | The same string | The same string |
| `42` | `'42'` | `42` |
| `true` | `'true'` | `true` |
| `null` | `''` (see note 1) | `null` |
| `''` | `''` | `''` |
| `undefined` | Key omitted | Key omitted |
| `['a', 'b']` | `['a', 'b']` | `['a', 'b']` |
| `['a']` | `'a'` (known limit) | `['a']` |
| `[]` | Key omitted (known limit) | `[]` |
| `[{ a: 1 }]` | `TypeError` | `[{ a: 1 }]` |
| `{}` | Key omitted (known limit) | `{}` |
| `{ u: { name: 'Ada', age: 3 } }` | `{ u: { name: 'Ada', age: '3' } }` | `{ u: { name: 'Ada', age: 3 } }` |
| A nested object with `deep: false` | A JSON string | The object |
| `new Date(0)` | An ISO string | An ISO string |
| `NaN`, `Infinity`, `BigInt` | `TypeError` | `TypeError` |
| `Map`, `Set`, a class instance, a function, a symbol | `TypeError` | `TypeError` |
| A circular reference | `TypeError` | `TypeError` |
| A key that contains `deepSeparator`, with `deep: true` | `TypeError` | `TypeError` |
| A key `__proto__`, `prototype` or `constructor` | `TypeError` | `TypeError` |
| A symbol key | `TypeError` | `TypeError` |

Notes:

1. In strings-only mode, `null` encodes as `''` and decodes as `''`. Use JSON mode to keep `null`.
2. In strings-only mode, `deep: false` and `deepLimit` write a nested object as JSON. The
   decoder returns that JSON as a string.
3. With `arrayFormat: 'repeat'`, the known limits for arrays also apply in JSON mode: a
   one-item array decodes as its item, and the encoder omits an empty array.
4. `-0` encodes as `0`.

## Errors

The encoder throws a `TypeError` for each value that cannot round-trip. The message contains
the key path, for example `filters.range` or `tags[1]`. The encoder also throws a `TypeError`
in these conditions:

- An array item is `undefined`, or the array has a hole.
- A date is not valid.
- A value written as JSON is deeper than `serialiseLimit`. The encoder does not truncate the data.
- In strings-only mode with `arrayFormat: 'repeat'`, an array holds an object or an array. Use
  JSON mode for these arrays.
- `deepSeparator` is an empty string. The decoder also throws for this condition.

The two functions throw a `RangeError` if `deepLimit` is not an integer of 0 or more, or
`Infinity`. The encoder also throws a `RangeError` for the same condition in `serialiseLimit`.
The message contains the option name and the value, for example
`toQueryString: deepLimit must be an integer of 0 or more, or Infinity. Received 1.5.`

In JSON mode, if a value is not valid JSON, the decoder throws a `SyntaxError`. The message
contains the key. The `cause` property holds the original error.

The decoder drops the keys `__proto__`, `prototype` and `constructor`. The encoder rejects them,
so neither function keeps data that the other function loses.

## Why the contract has these limits

_This section is rationale. It uses normal technical English, not STE._

- **One-item arrays, empty arrays and empty objects.** These limits come from the format. A
  plain query string has no way to say "an array of one" or "an empty object" without a marker
  such as brackets. JSON mode exists for callers who need these values.
- **No type guessing.** A decoder that turns `'12345'` into a number breaks postcodes, phone
  numbers and IDs. The caller picks the mode instead, so the result type never depends on what
  the text looks like.
- **Throwing instead of dropping.** A silent drop or a placeholder such as `[Object]` corrupts
  data without telling anyone. A `TypeError` with the key path shows the problem at the point
  where the data is written.
- **`deep: false` in strings-only mode.** This option still writes JSON, and that JSON decodes as
  a string. Throwing instead would break a documented feature, so the behaviour is documented.
