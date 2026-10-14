import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

// Runs after TypeDoc. Moves every type alias and interface page in a category onto the page of
// the function it belongs to, under a "Types" heading, then deletes the standalone pages and
// points every link at the new anchors. A type belongs to the function whose PascalCase name is
// the longest prefix of the type name, which barrels.ts already requires of every export.
// Standalone types (docs/api/types) belong to no function, so they keep their own pages.

const apiDir = join(import.meta.dirname, '..', 'docs', 'api')

// Type aliases come first: they are usually the union a reader passes in, and the interfaces
// are its branches.
const kinds = [
  { dir: 'type-aliases', label: 'type' },
  { dir: 'interfaces', label: 'interface' },
] as const

type TypePage = { name: string; file: string; label: string }

const isDirectory = (path: string): boolean => {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

const listPages = (dir: string): string[] =>
  isDirectory(dir)
    ? readdirSync(dir)
        .filter((file) => file.endsWith('.md'))
        .map((file) => file.replace(/\.md$/, ''))
        .sort()
    : []

const listMarkdown = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (isDirectory(path)) return listMarkdown(path)
    return path.endsWith('.md') ? [path] : []
  })

const pascalCase = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1)

const anchorFor = (name: string): string => name.toLowerCase()

// TypeDoc writes each link relative to the page it is on. A section moves to another folder, so
// its relative links are rewritten to point from the function page instead.
const rebaseLinks = (line: string, from: string, to: string): string =>
  line.replace(/\]\(([^)\s#:]+\.md)((?:#[^)\s]*)?)\)/g, (_link, path: string, hash: string) => {
    const target = relative(dirname(to), resolve(dirname(from), path)).replace(/\\/g, '/')
    return `](${target}${hash})`
  })

// Turns a TypeDoc type page into a "###" section: drops the breadcrumb, replaces the
// "# Interface: Name" title, moves every other heading down two levels, and rebases relative
// links onto `page`. Headings and links inside code fences are left alone.
const toSection = ({ name, file, label }: TypePage, page: string): string => {
  let inFence = false
  const body = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter((line, index) => !(index === 0 && line.startsWith('[')))
    .map((line) => {
      if (line.startsWith('```')) inFence = !inFence
      if (inFence) return line
      if (/^# /.test(line)) {
        const title = line.replace(/^# [^:]+: /, '')
        return `### ${title} <Badge type="info" text="${label}" /> {#${anchorFor(name)}}`
      }
      const heading = /^(#{1,6}) (.*)$/.exec(line)
      if (!heading) return rebaseLinks(line, file, page)
      const [, hashes = '', text = ''] = heading
      return `${'#'.repeat(Math.min(hashes.length + 2, 6))} ${text}`
    })
    .join('\n')
    .trim()
  return body
}

// Absolute path of each moved type page, to the function page and anchor it now lives at.
const moved = new Map<string, { page: string; anchor: string }>()

const categories = readdirSync(apiDir).filter((name) =>
  isDirectory(join(apiDir, name, 'functions')),
)

for (const category of categories) {
  const categoryDir = join(apiDir, category)
  const functions = listPages(join(categoryDir, 'functions'))
  const owned = new Map<string, TypePage[]>(functions.map((name) => [name, []]))

  for (const { dir, label } of kinds) {
    for (const name of listPages(join(categoryDir, dir))) {
      const owner = functions
        .filter((fn) => name.startsWith(pascalCase(fn)))
        .sort((a, b) => b.length - a.length)[0]
      if (!owner) {
        throw new Error(
          `${category}/${dir}/${name}.md: no function in "${category}" whose name starts the type name.`,
        )
      }
      owned.get(owner)?.push({ name, file: join(categoryDir, dir, `${name}.md`), label })
    }
  }

  for (const [fn, types] of owned) {
    if (types.length === 0) continue
    const page = join(categoryDir, 'functions', `${fn}.md`)
    const sections = types.map((type) => toSection(type, page)).join('\n\n***\n\n')
    const content = readFileSync(page, 'utf8').trimEnd()
    writeFileSync(page, `${content}\n\n## Types\n\n${sections}\n`)
    for (const type of types) moved.set(type.file, { page, anchor: anchorFor(type.name) })
    console.log(`Inlined ${types.map((type) => type.name).join(', ')} into ${category}/${fn}`)
  }

  for (const { dir } of kinds) rmSync(join(categoryDir, dir), { recursive: true, force: true })
}

// TypeDoc gives every overload of a function the same "## Call Signature" heading, so the page
// outline repeats it. Each heading is renamed after the signature line under it, without the
// return type: "> **sum**\<`T`\>(`array`, `options`): `number`" gives "sum\<T\>(array, options)".
const signatureHeading = (signature: string): string =>
  signature
    .replace(/^> /, '')
    .replace(/[`*]/g, '')
    .replace(/\\</g, '<')
    .replace(/\\>/g, '>')
    .replace(/\):[^)]*$/, ')')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')

for (const category of categories) {
  for (const name of listPages(join(apiDir, category, 'functions'))) {
    const page = join(apiDir, category, 'functions', `${name}.md`)
    const lines = readFileSync(page, 'utf8').split(/\r?\n/)
    let renamed = false
    lines.forEach((line, index) => {
      if (line !== '## Call Signature') return
      const signature = lines.slice(index + 1).find((next) => next.startsWith('> '))
      if (!signature) return
      lines[index] = `## ${signatureHeading(signature)}`
      renamed = true
    })
    if (renamed) writeFileSync(page, lines.join('\n'))
  }
}

// Every relative link that pointed at a moved page now points at its anchor. On the function
// page itself, that is just the anchor.
for (const file of listMarkdown(apiDir)) {
  const content = readFileSync(file, 'utf8')
  const updated = content.replace(/\]\(([^)\s#]+\.md)(#[^)\s]*)?\)/g, (link, path: string) => {
    const target = moved.get(resolve(dirname(file), path))
    if (!target) return link
    if (target.page === file) return `](#${target.anchor})`
    const to = relative(dirname(file), target.page).replace(/\\/g, '/')
    return `](${to}#${target.anchor})`
  })
  if (updated !== content) writeFileSync(file, updated)
}
