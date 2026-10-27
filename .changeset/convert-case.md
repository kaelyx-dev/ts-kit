---
'@kaelyx/ts-kit': minor
---

Add `convertCase`, which converts a string in any case to snake, constant, ada, kebab, cobol, train, flat, upper flat, pascal, camel, lower, upper or title case. Options control known acronyms (`acronyms`, added to the built-in `ConvertCaseAcronyms`), how unknown acronyms are read (`unknownAcronyms`, `minAcronymLength`) and which word digits go into (`digits`). The option values are also exported as objects (`ConvertCaseStyle`, `ConvertCaseUnknownAcronyms` and `ConvertCaseDigits`), so you can write `convertCase(input, { to: ConvertCaseStyle.snake })` as well as `{ to: 'snake' }`. `ConvertCaseFormats` gives the separator and word casing of each case.
