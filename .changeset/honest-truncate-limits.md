---
"@kaelyx/ts-kit": minor
---

Changed the default behaviour of `truncate`. These changes are not backward compatible:

- The default `append` is now `''` in all calls. Before, a call with an options object but no `append` added `'...'`.
- `includeAppendInLength` is now `true` by default, so the result is never longer than `length`. If the suffix is longer than `length`, the result is the cut text without the suffix. Before, the result was part of the suffix.
- Lengths are now counted in grapheme clusters, not UTF-16 code units. The function no longer splits an emoji or separates an accent from its letter. The length of `append` is counted in the same way.
- A `NaN` length now throws a `RangeError`. A non-integer length is rounded down, and an `Infinity` length returns the input.
- Trailing whitespace is now removed from the cut text, also when there is no suffix: `truncate('hello world', 6)` returns `'hello'`, not `'hello '`.

`truncateAtWordBoundary` now treats all whitespace (for example tabs and newlines) as a boundary. It keeps the last word when the cut already ends that word, and it uses the hard cut when no boundary exists before the cut.
