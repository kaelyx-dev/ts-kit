import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { build } from 'esbuild'
import { root } from './layout'

// Prints the minified and gzipped size of each export, as a consumer's bundler includes it from
// the root entry, plus the size of the whole package. Bundlephobia measures the same thing.
// It reads the build output, so run "npm run build" first.

const entry = join(root, 'index.js')

const measure = async (contents: string) => {
  const result = await build({
    stdin: { contents, resolveDir: root },
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'error',
  })
  const code = result.outputFiles[0]?.contents ?? new Uint8Array()
  return { min: code.length, gzip: gzipSync(code, { level: 9 }).length }
}

const names = Object.keys(await import(pathToFileURL(entry).href))

const rows = await Promise.all(
  names.map(async (name) => ({ name, ...(await measure(`export { ${name} } from './index.js'`)) })),
)
rows.sort((a, b) => b.gzip - a.gzip)
rows.push({ name: '(everything)', ...(await measure(`export * from './index.js'`)) })

const width = Math.max(...rows.map((row) => row.name.length))
const format = (name: string, min: string, gzip: string) =>
  `${name.padEnd(width)}  ${min.padStart(8)}  ${gzip.padStart(8)}`

console.log(format('export', 'min', 'gzip'))
for (const { name, min, gzip } of rows) {
  console.log(format(name, `${min} B`, `${gzip} B`))
}
