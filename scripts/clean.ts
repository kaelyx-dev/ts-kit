import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { outputPaths, root } from './layout'

// Deletes the build output from the package root. Only removes the paths in layout.ts, never
// anything else, because tsdown's own clean option would empty the whole root.
// Also removes dist/, left over from builds before the output moved to the root.

for (const path of [...outputPaths(), 'dist']) {
  rmSync(join(root, path), { recursive: true, force: true })
}
