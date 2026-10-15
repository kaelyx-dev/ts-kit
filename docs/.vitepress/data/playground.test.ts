import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as tsKit from '../../../src'
import {
  importLine,
  loadPlayground,
  readFunction,
  readSources,
  readValueExports,
} from './playground'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const data = loadPlayground(root)
const entries = data.categories.flatMap((c) => c.functions)
const { sources, available } = readSources(root)

describe('loadPlayground', () => {
  it('reads every exported function, and nothing else', () => {
    const exported = Object.entries(tsKit)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
    expect(sources.map((s) => s.name).sort()).toEqual(exported.sort())
  })

  it('has an entry for every function that is not excluded', () => {
    const included = sources.filter((s) => !s.excluded).map((s) => s.name)
    expect(entries.map((f) => f.name).sort()).toEqual(included.sort())
  })

  it('can import every exported value', () => {
    expect(available.sort()).toEqual(Object.keys(tsKit).sort())
  })

  it('imports a constant that an example uses', () => {
    const code = entries.find((f) => f.name === 'randomString')?.code
    expect(code).toMatch(/^import \{ RandomStringCharset, randomString \} from '@kaelyx\/ts-kit'/)
  })

  it('excludes the _internal and types categories', () => {
    expect(data.categories.map((c) => c.name)).not.toContain('_internal')
    expect(data.categories.map((c) => c.name)).not.toContain('types')
  })

  it('reads the version from package.json', () => {
    expect(data.version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('uses the exported name, not the directory slug', () => {
    const fn = entries.find((f) => f.slug === 'debounce-with-abort')
    expect(fn?.name).toBe('debounceWithAbort')
  })

  it('collects the examples from every overload of sum', () => {
    const code = entries.find((f) => f.name === 'sum')?.code
    expect(code).toContain('console.log(sum([1, 2, 3]))')
    expect(code).toContain("console.log(sum([{ price: 2 }, { price: 3 }], { key: 'price' }))")
  })
})

describe('readFunction', () => {
  const read = (source: string) => readFunction('src/a/b/b.ts', 'a', source)

  it('uses @playground instead of @example when both exist', () => {
    const fn = read(`
/**
 * Does a thing.
 *
 * @example
 * \`\`\`ts
 * f(document)
 * \`\`\`
 * @playground
 * \`\`\`ts
 * f(1)
 * \`\`\`
 */
export function f(x: unknown): unknown { return x }`)
    expect(fn?.body).toBe('console.log(f(1))')
    expect(fn?.summary).toBe('Does a thing.')
  })

  it('removes duplicate examples', () => {
    const doc = '/**\n * @example\n * ```ts\n * f(1)\n * ```\n */'
    const fn = read(
      `${doc}\nexport function f(x: number): number\n${doc}\nexport function f(x: number) { return x }`,
    )
    expect(fn?.body).toBe('console.log(f(1))')
  })

  it('reads an exported variable statement', () => {
    expect(read('/** Hi. */\nexport const g = () => 1')?.name).toBe('g')
  })

  it('makes a placeholder for a function with no example', () => {
    expect(read('/** Hi. */\nexport const g = () => 1')?.body).toBe('console.log(g)')
  })

  it('marks a function with @playgroundExclude as excluded', () => {
    expect(
      read('/**\n * Hi.\n *\n * @playgroundExclude\n */\nexport const g = () => 1')?.excluded,
    ).toBe(true)
    expect(read('/** Hi. */\nexport const g = () => 1')?.excluded).toBe(false)
  })

  it('returns undefined for a file with no exported value', () => {
    expect(read('export type T = string\nconst x = 1')).toBeUndefined()
  })
})

describe('importLine', () => {
  it('imports each available name that the code uses outside a comment', () => {
    const body = 'console.log(unwrap(ok(42))) // err'
    expect(importLine(body, ['err', 'ok', 'unwrap', 'sum'])).toBe(
      "import { ok, unwrap } from '@kaelyx/ts-kit'",
    )
  })
})

describe('readValueExports', () => {
  it('reads the exported variables and ignores types and private values', () => {
    const source = 'export const A = {}\nexport type A = string\nconst B = 1\nexport interface C {}'
    expect(readValueExports('a.types.ts', source)).toEqual(['A'])
  })
})
