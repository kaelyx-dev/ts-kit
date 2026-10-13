import { globSync } from 'tinyglobby'
import { defineConfig } from 'tsdown'

// src/array/concatenate/concatenate.ts -> array/concatenate
// src/array/index.ts                   -> array
const entryName = (file: string) => file.replace(/^src\//, '').replace(/\/[^/]+\.ts$/, '')

const categories = globSync('src/*/index.ts')
const functions = globSync('src/*/*/*.ts', {
  ignore: ['**/*.test.ts', '**/*.types.ts', 'src/_internal/**'],
})

export default defineConfig({
  entry: Object.fromEntries([
    ['index', 'src/index.ts'],
    ...categories.map((f) => [entryName(f), f]),
    ...functions.map((f) => [entryName(f), f]),
  ]),
  format: ['esm'],
  dts: true,
  treeshake: true,
  // Output goes to the package root (see scripts/layout.ts), so tsdown must not clean it.
  // "npm run build" runs scripts/clean.ts first instead.
  outDir: '.',
  clean: false,
  fixedExtension: false,
  unbundle: true,
})
