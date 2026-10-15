import { readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { globSync } from 'tinyglobby'
import ts from 'typescript'
import { stripComment, toRunnable } from './to-runnable'

export interface PlaygroundFunction {
  /** The exported name, for example `debounceWithAbort`. */
  name: string
  /** The directory name, for example `debounce-with-abort`. */
  slug: string
  category: string
  summary: string
  code: string
}

/** A function as {@link readFunction} reads it, before the import line is added. */
export type PlaygroundSource = Omit<PlaygroundFunction, 'code'> & {
  body: string
  /** True if the TSDoc comment has the `@playgroundExclude` modifier tag. */
  excluded: boolean
}

export interface PlaygroundData {
  version: string
  categories: { name: string; functions: PlaygroundFunction[] }[]
}

/** Categories that have no runtime functions for the playground. */
export const EXCLUDED_CATEGORIES: readonly string[] = ['_internal', 'types']

const PACKAGE_NAME = '@kaelyx/ts-kit'

const parse = (file: string, source: string): ts.SourceFile =>
  ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)

const isExported = (node: ts.Node): boolean =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false)

/** Returns the exported name of a function declaration or variable statement. */
const exportedName = (node: ts.Node): string | undefined => {
  if (!isExported(node)) return undefined
  if (ts.isFunctionDeclaration(node)) return node.name?.text
  if (ts.isVariableStatement(node)) {
    const name = node.declarationList.declarations[0]?.name
    return name && ts.isIdentifier(name) ? name.text : undefined
  }
  return undefined
}

const commentText = (comment: string | ts.NodeArray<ts.JSDocComment> | undefined): string =>
  ts.getTextOfJSDocComment(comment) ?? ''

/** Removes the code fences from a tag and the blank lines around the code. */
const stripFences = (text: string): string =>
  text
    .split('\n')
    .filter((line) => !line.trim().startsWith('```'))
    .join('\n')
    .trim()

const readTag = (docs: readonly ts.JSDoc[], tagName: string): string[] =>
  docs.flatMap((doc) =>
    (doc.tags ?? [])
      .filter((tag) => tag.tagName.text === tagName)
      .map((tag) => stripFences(commentText(tag.comment)))
      .filter((code) => code !== ''),
  )

const hasTag = (docs: readonly ts.JSDoc[], tagName: string): boolean =>
  docs.some((doc) => doc.tags?.some((tag) => tag.tagName.text === tagName))

const jsDocsOf = (node: ts.Node): ts.JSDoc[] =>
  ts.getJSDocCommentsAndTags(node).filter((doc): doc is ts.JSDoc => ts.isJSDoc(doc))

/** Returns the names of the exported values in a file, such as the `as const` option objects. */
export const readValueExports = (file: string, source: string): string[] =>
  parse(file, source)
    .statements.filter(ts.isVariableStatement)
    .map(exportedName)
    .filter((name): name is string => name !== undefined)

/**
 * Makes the import line for an example. It imports each name in `available` that the code uses
 * outside a comment, so an example for `unwrap` also gets `ok` and `err`.
 */
export const importLine = (body: string, available: readonly string[]): string => {
  const code = body.split('\n').map(stripComment).join('\n')
  const used = available.filter((name) => new RegExp(`\\b${name}\\b`).test(code))
  return `import { ${used.sort().join(', ')} } from '${PACKAGE_NAME}'`
}

/**
 * Reads one function file. Returns `undefined` if the file exports no function or variable.
 * The `@playground` tag replaces the `@example` tags when the file has one.
 */
export const readFunction = (
  file: string,
  category: string,
  source: string,
): PlaygroundSource | undefined => {
  const sourceFile = parse(file, source)
  let name: string | undefined
  const docs: ts.JSDoc[] = []
  for (const statement of sourceFile.statements) {
    const statementName = exportedName(statement)
    if (statementName === undefined) continue
    name ??= statementName
    if (statementName === name) docs.push(...jsDocsOf(statement))
  }
  if (name === undefined) return undefined

  const playground = readTag(docs, 'playground')
  const examples = [...new Set(playground.length > 0 ? playground : readTag(docs, 'example'))]
  const summary =
    commentText(docs[0]?.comment)
      .split(/\n\s*\n/)[0]
      ?.replace(/\s+/g, ' ') ?? ''
  const body = examples.length > 0 ? toRunnable(examples.join('\n\n')) : `console.log(${name})`

  return {
    name,
    slug: basename(dirname(file)),
    category,
    summary: summary.trim(),
    body,
    excluded: hasTag(docs, 'playgroundExclude'),
  }
}

const glob = (root: string, pattern: string, ignore: string[]): string[] =>
  globSync(pattern, {
    cwd: root,
    ignore: [...ignore, ...EXCLUDED_CATEGORIES.map((c) => `src/${c}/**`)],
  }).sort()

/**
 * Reads every function in `src` under `root`, including the excluded ones. `available` is every
 * name that an example can import: the functions and the exported values in the types files.
 */
export const readSources = (root: string): { sources: PlaygroundSource[]; available: string[] } => {
  const read = (file: string): string => readFileSync(join(root, file), 'utf8')
  const sources = glob(root, 'src/*/*/*.ts', ['**/*.test.ts', '**/*.types.ts']).flatMap(
    (file) => readFunction(file, file.split('/')[1] as string, read(file)) ?? [],
  )
  const values = glob(root, 'src/*/*/*.types.ts', []).flatMap((file) =>
    readValueExports(file, read(file)),
  )
  return { sources, available: [...sources.map((s) => s.name), ...values] }
}

/** Reads every function in `src` under `root` that is not excluded, grouped by category. */
export const loadPlayground = (root: string): PlaygroundData => {
  const { sources, available } = readSources(root)

  const byCategory = new Map<string, PlaygroundFunction[]>()
  for (const { body, excluded, ...fn } of sources) {
    if (excluded) continue
    const code = `${importLine(body, available)}\n\n${body}\n`
    const list = byCategory.get(fn.category) ?? []
    list.push({ ...fn, code })
    byCategory.set(fn.category, list)
  }

  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string }
  return {
    version: pkg.version,
    categories: [...byCategory].map(([name, functions]) => ({
      name,
      functions: functions.sort((a, b) => a.name.localeCompare(b.name)),
    })),
  }
}
