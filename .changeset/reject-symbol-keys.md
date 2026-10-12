---
"@kaelyx/ts-kit": minor
---

`toQueryString` now throws a `TypeError` if an object has an enumerable symbol key. Before this change, `Object.entries` skipped the key, and its data was lost with no error. The message contains the key path, for example `filters.Symbol(s)`. A symbol key that is not enumerable is ignored.
