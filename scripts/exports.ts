import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { listCategories, listFunctions, outputDirectories, outputPaths, root } from './layout'

// Writes (or checks) package.json's "exports", "typesVersions" and "files" from the src/ directory
// structure, and the block of build output paths in .gitignore.
// Run with --check to verify both files match what this script would write.
// Keep this in sync with the entry globs in tsdown.config.ts.

const pkgPath = join(root, 'package.json')
const gitignorePath = join(root, '.gitignore')

const gitignoreStart = '# Build output, written by "npm run exports"'
const gitignoreEnd = '# End of build output'

const subpathEntry = (subpath: string) => ({
  types: `./${subpath}.d.ts`,
  default: `./${subpath}.js`,
})

const buildExports = (): Record<string, unknown> => {
  const exportsMap: Record<string, unknown> = { '.': subpathEntry('index') }

  for (const category of listCategories()) {
    exportsMap[`./${category}`] = subpathEntry(category)
    for (const fn of category === 'types' ? [] : listFunctions(category)) {
      exportsMap[`./${category}/${fn}`] = subpathEntry(`${category}/${fn}`)
    }
  }

  exportsMap['./package.json'] = './package.json'
  return exportsMap
}

// TypeScript's legacy "node" (node10) resolution ignores "exports", so mirror each subpath here.
// Explicit entries (rather than a "*" wildcard) stop editors suggesting unexported paths.
const buildTypesVersions = (exportsMap: Record<string, unknown>): Record<string, unknown> => {
  const paths: Record<string, string[]> = {}
  for (const [subpath, entry] of Object.entries(exportsMap)) {
    if (subpath === '.' || typeof entry !== 'object' || entry === null) continue
    paths[subpath.slice(2)] = [(entry as { types: string }).types]
  }
  return { '*': paths }
}

const buildGitignore = (current: string): string => {
  const directories = new Set(outputDirectories())
  const block = [
    gitignoreStart,
    ...outputPaths().map((path) => (directories.has(path) ? `/${path}/` : `/${path}`)),
    gitignoreEnd,
  ].join('\n')
  const start = current.indexOf(gitignoreStart)
  const end = current.indexOf(gitignoreEnd)
  if (start === -1 || end === -1) {
    return `${current.trimEnd()}\n\n${block}\n`
  }
  return current.slice(0, start) + block + current.slice(end + gitignoreEnd.length)
}

const checkMode = process.argv.includes('--check')

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const expected = buildExports()
const expectedTypesVersions = buildTypesVersions(expected)
const expectedFiles = outputPaths()
const gitignore = readFileSync(gitignorePath, 'utf8')
const expectedGitignore = buildGitignore(gitignore)

if (
  JSON.stringify(pkg.exports) === JSON.stringify(expected) &&
  JSON.stringify(pkg.typesVersions) === JSON.stringify(expectedTypesVersions) &&
  JSON.stringify(pkg.files) === JSON.stringify(expectedFiles) &&
  gitignore === expectedGitignore
) {
  process.exit(0)
}

if (checkMode) {
  console.error(
    'package.json ("exports", "typesVersions" or "files") or .gitignore is out of date. Run "npm run exports" to fix this.',
  )
  process.exit(1)
}

pkg.files = expectedFiles
pkg.typesVersions = expectedTypesVersions
pkg.exports = expected
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
writeFileSync(gitignorePath, expectedGitignore)
console.log('Wrote package.json exports, typesVersions and files, and the .gitignore build block.')
