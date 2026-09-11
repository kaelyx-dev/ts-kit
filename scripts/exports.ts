import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Writes (or checks) package.json's "exports" map from the src/ directory structure.
// Run with --check to verify package.json matches what this script would write.
// Keep this in sync with the entry globs in tsdown.config.ts.

const root = join(import.meta.dirname, '..')
const srcDir = join(root, 'src')
const pkgPath = join(root, 'package.json')

const isDirectory = (path: string): boolean => {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

const listCategories = (): string[] =>
  readdirSync(srcDir)
    .filter((name) => name !== '_internal' && isDirectory(join(srcDir, name)))
    .sort()

const listFunctions = (category: string): string[] =>
  readdirSync(join(srcDir, category))
    .filter((name) => isDirectory(join(srcDir, category, name)))
    .sort()

const subpathEntry = (subpath: string) => ({
  types: `./dist/${subpath}.d.ts`,
  default: `./dist/${subpath}.js`,
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

const checkMode = process.argv.includes('--check')

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const expected = buildExports()

if (JSON.stringify(pkg.exports) === JSON.stringify(expected)) {
  process.exit(0)
}

if (checkMode) {
  console.error('package.json "exports" is out of date. Run "npm run exports" to fix this.')
  process.exit(1)
}

pkg.exports = expected
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
console.log('Wrote package.json exports map.')
