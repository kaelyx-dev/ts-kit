---
"@kaelyx/ts-kit": minor
---

Add a `unit` option to `truncate`. Set it to `'codeUnit'` to fit a limit on `.length`, or to `'byte'` to fit a limit in UTF-8 bytes. The default is `'grapheme'`, so the default behaviour does not change. In each unit, the cut is between graphemes, so the result can be shorter than `length`, or empty.
