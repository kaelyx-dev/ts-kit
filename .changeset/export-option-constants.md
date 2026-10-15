---
"@kaelyx/ts-kit": patch
---

**Fix:** `RandomStringCharset`, `SumOptionsMissingBehaviour`, `ClampUndefinedBehaviour`, `TemplateOptionsReplaceBehaviour` and `TemplateOptionsUnknownBehaviour` are now exported as values from `@kaelyx/ts-kit`, from their category (for example `@kaelyx/ts-kit/string`) and from their function subpath (for example `@kaelyx/ts-kit/string/random-string`). Before, these entry points exported them only as types, so code such as `randomString({ charset: RandomStringCharset.hex })` failed at run time. They were available as values only from `@kaelyx/ts-kit/types`.
