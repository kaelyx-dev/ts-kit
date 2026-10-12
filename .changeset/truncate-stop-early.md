---
"@kaelyx/ts-kit": patch
---

`truncate` now reads only the graphemes that it needs. Before this change, it segmented all of the input before the cut, so a long input was slow to truncate. The result does not change.
