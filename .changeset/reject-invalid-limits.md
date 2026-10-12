---
"@kaelyx/ts-kit": minor
---

`toQueryString` and `fromQueryString` now throw a `RangeError` if `deepLimit` is not an integer of 0 or more, or `Infinity`. `toQueryString` also throws a `RangeError` for the same condition in `serialiseLimit`. Before this change, a value such as `1.5` or `-1` was accepted, and the decoder split keys at a different level from the encoder.
