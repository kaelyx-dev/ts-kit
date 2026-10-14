---
"@kaelyx/ts-kit": minor
---

**Breaking:** `toQueryString` and `fromQueryString` are now thin wrappers around `URLSearchParams` for flat objects, with no options. `toQueryString` writes an array as repeated keys, `null` as an empty string and a date as an ISO string, and omits `undefined`. `fromQueryString` returns a string for each key, or an array of strings for a repeated key. Nested objects (`deep`, `deepSeparator`, `deepLimit`), JSON mode (`mode`, `arrayFormat`, `serialiseLimit`) and the option types are removed. For nested data, write the value with `JSON.stringify` and put the result in one key. `toQueryString` is now about 0.2 kB gzipped instead of 1.7 kB.
