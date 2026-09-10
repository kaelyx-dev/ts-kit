import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline/promises'

// Scaffolds a new function: npm run new -- <category> <name>
// With no arguments, the script asks for the category and the name.

const root = join(import.meta.dirname, '..')
const srcDir = join(root, 'src')

const kebabCasePattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

const isDirectory = (path: string): boolean => {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

const kebabToCamel = (name: string): string =>
  name.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase())

const kebabToPascal = (name: string): string => {
  const camel = kebabToCamel(name)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

const listCategories = (): string[] =>
  existsSync(srcDir)
    ? readdirSync(srcDir).filter((name) => name !== 'types' && isDirectory(join(srcDir, name)))
    : []

const findExistingFunction = (name: string): string | undefined => {
  for (const category of listCategories()) {
    const candidate = join(srcDir, category, name)
    if (isDirectory(candidate)) {
      return category
    }
  }
  return undefined
}

const prompt = async (question: string): Promise<string> => {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    return (await rl.question(question)).trim()
  } finally {
    rl.close()
  }
}

const functionTemplate = (name: string): string => {
  const exportName = kebabToCamel(name)
  return `export type * from './${name}.types'

/**
 * One sentence that says what the function does.
 *
 * @param input - The data. Say what an empty value does.
 * @returns Say what comes back.
 * @throws If the function throws, say when. Delete this line if it does not.
 *
 * @example
 * \`\`\`ts
 * ${exportName}() // result
 * \`\`\`
 *
 * @category ${name}
 */
export function ${exportName}(input: never): void {
  throw new Error('not implemented')
}
`
}

const testTemplate = (name: string): string => {
  const exportName = kebabToCamel(name)
  return `import { describe, expect, it } from 'vitest'
import { ${exportName} } from './${name}'

describe('${exportName}', () => {
  it('handles the normal case', () => {
    expect(${exportName}).toBeTypeOf('function')
  })

  it('handles the empty case', () => {
    expect.fail('write this test')
  })
})
`
}

const typesTemplate = (name: string): string => {
  const typeName = kebabToPascal(name)
  return `// Public types for ${name}.
// Every exported name must start with "${typeName}".
export {}
`
}

const main = async (): Promise<void> => {
  const [argCategory, argName] = process.argv.slice(2)

  const category = argCategory ?? (await prompt('Category: '))
  const name = argName ?? (await prompt('Function name: '))

  if (!kebabCasePattern.test(name)) {
    console.error(`Error: "${name}" is not kebab-case.`)
    process.exit(1)
  }

  if (!kebabCasePattern.test(category)) {
    console.error(`Error: "${category}" is not kebab-case.`)
    process.exit(1)
  }

  const existingCategory = findExistingFunction(name)
  if (existingCategory !== undefined) {
    console.error(
      `Error: a function named "${name}" already exists in category "${existingCategory}".`,
    )
    process.exit(1)
  }

  const categoryDir = join(srcDir, category)
  if (!isDirectory(categoryDir)) {
    const answer = await prompt(`Category "${category}" does not exist. Create it? (y/N) `)
    if (answer.toLowerCase() !== 'y') {
      console.error('Aborted.')
      process.exit(1)
    }
  }

  const functionDir = join(categoryDir, name)
  if (existsSync(functionDir)) {
    console.error(`Error: ${functionDir} already exists.`)
    process.exit(1)
  }

  mkdirSync(functionDir, { recursive: true })
  writeFileSync(join(functionDir, `${name}.ts`), functionTemplate(name))
  writeFileSync(join(functionDir, `${name}.test.ts`), testTemplate(name))
  writeFileSync(join(functionDir, `${name}.types.ts`), typesTemplate(name))

  execFileSync('tsx', [join(root, 'scripts', 'barrels.ts')], { stdio: 'inherit' })

  console.log(`\nCreated @kaelyx/ts-kit/${category}/${name}`)
  console.log(join(functionDir, `${name}.ts`))
  console.log(join(functionDir, `${name}.test.ts`))
  console.log(join(functionDir, `${name}.types.ts`))
}

main()
