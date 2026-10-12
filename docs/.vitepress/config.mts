import { readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

// The API sidebar is assembled here, not from typedoc-vitepress-theme's auto-generated
// typedoc-sidebar.json, so it only lists functions: one section per category, then the
// standalone types. typedoc.json builds one module per category (entryPoints:
// "src/*/index.ts"), and scripts/inline-types.ts then moves every type and interface onto the
// page of the function it belongs to, so a category folder under docs/api only keeps functions/.
const apiDir = fileURLToPath(new URL('../api', import.meta.url))

const isDirectory = (path: string): boolean => {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

const readPages = (dir: string): { text: string; link: string }[] =>
  isDirectory(dir)
    ? readdirSync(dir)
        .filter((file) => file.endsWith('.md'))
        .map((file) => file.replace(/\.md$/, ''))
        .sort()
        .map((name) => ({
          text: name,
          link: `/api${dir.slice(apiDir.length).replace(/\\/g, '/')}/${name}`,
        }))
    : []

const categories = isDirectory(apiDir)
  ? readdirSync(apiDir)
      .filter((name) => name !== 'types' && isDirectory(`${apiDir}/${name}`))
      .sort()
  : []

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

// Standalone types (src/types/<name>/) belong to no function, so they keep their own pages in
// the types module and come after the categories.
const apiSidebar = [
  ...categories.map((category) => ({
    text: capitalize(category),
    link: `/api/${category}/`,
    collapsed: false,
    items: readPages(`${apiDir}/${category}/functions`),
  })),
  {
    text: 'Types',
    link: '/api/types/',
    collapsed: false,
    items: ['type-aliases', 'interfaces'].flatMap((kind) => readPages(`${apiDir}/types/${kind}`)),
  },
].filter((section) => section.items.length > 0)

export default defineConfig({
  title: '@kaelyx/ts-kit',
  description: 'Small TypeScript utility functions with no dependencies at run time.',
  base: '/ts-kit/', // served from https://kaelyx.dev/ts-kit/, not the domain root
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
    ],
    sidebar: {
      '/api/': apiSidebar,
      '/': [
        {
          text: 'Guide',
          collapsed: false,
          items: [
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Scripts', link: '/guide/scripts' },
            { text: 'Adding a function', link: '/guide/adding-a-function' },
            { text: 'Adding a type', link: '/guide/adding-a-type' },
            { text: 'Changesets and releases', link: '/guide/changesets-and-releases' },
            { text: 'Roadmap', link: '/roadmap' },
          ],
        },
        {
          text: 'Project Policies',
          collapsed: false,
          items: [
            { text: 'Contributing', link: '/contributing' },
            { text: 'AI Policy', link: '/ai-policy' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/kaelyx-dev/ts-kit' }],
    search: {
      provider: 'local',
    },
  },
})
