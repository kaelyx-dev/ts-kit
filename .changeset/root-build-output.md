---
"@kaelyx/ts-kit": patch
---

Publish the build output at the package root instead of in `dist/`. Editors that make import paths from file locations (for example, when a project's `paths` maps into `node_modules`) now suggest paths that work, such as `@kaelyx/ts-kit`, instead of `@kaelyx/ts-kit/dist`. The documented import paths do not change.
