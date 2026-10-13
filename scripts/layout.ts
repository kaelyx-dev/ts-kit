import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// The build writes straight into the package root (index.js, number.js, number/clamp.js, ...), not dist/.
// Editors that derive import paths from file locations then suggest paths that really exist.
// This module lists what the build writes, so the clean and exports scripts agree on it.

export const root: string = join(import.meta.dirname, '..')
export const srcDir: string = join(root, 'src')

// Root entries that are part of the repository. A category with one of these names would
// overwrite them on build, and the clean script would delete them.
const reservedRootNames = new Set(['coverage', 'dist', 'docs', 'node_modules', 'scripts', 'src'])

export const isDirectory = (path: string): boolean => {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

export const listCategories = (): string[] => {
  const categories = readdirSync(srcDir)
    .filter((name) => name !== '_internal' && isDirectory(join(srcDir, name)))
    .sort()
  const clashes = categories.filter((name) => reservedRootNames.has(name))
  if (clashes.length > 0) {
    throw new Error(`Category names clash with root folders: ${clashes.join(', ')}. Rename them.`)
  }
  return categories
}

export const listFunctions = (category: string): string[] =>
  readdirSync(join(srcDir, category))
    .filter((name) => isDirectory(join(srcDir, category, name)))
    .sort()

// Folders the build writes at the root: one per category, plus shared internals.
export const outputDirectories = (): string[] => ['_internal', ...listCategories()]

// Every root path the build writes, for package.json "files" and the clean script.
export const outputPaths = (): string[] =>
  [
    'index.js',
    'index.d.ts',
    ...outputDirectories(),
    ...listCategories().flatMap((category) => [`${category}.js`, `${category}.d.ts`]),
  ].sort()
