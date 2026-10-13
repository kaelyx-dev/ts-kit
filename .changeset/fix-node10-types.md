---
"@kaelyx/ts-kit": patch
---

Fix type resolution for consumers using `moduleResolution: "node"` (node10). Subpath imports such as `@kaelyx/ts-kit/number/clamp` now resolve and appear in IntelliSense, instead of auto-import suggesting the unexported `dist/...` path.
