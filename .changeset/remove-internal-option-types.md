---
"@kaelyx/ts-kit": minor
---

Remove the `ToQueryStringResolvedOptions` and `FromQueryStringResolvedOptions` types from the public API. They were internal types, and the `@internal` tag hid them only in the docs. Use `ToQueryStringOptions` and `FromQueryStringOptions` instead.
