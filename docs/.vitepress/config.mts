import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

// typedoc-vitepress-theme writes this file when `npm run docs` has been run.
// It does not exist on a fresh clone, so fall back to an empty sidebar.
const sidebarPath = fileURLToPath(new URL('../api/typedoc-sidebar.json', import.meta.url))
const typedocSidebar = existsSync(sidebarPath) ? JSON.parse(readFileSync(sidebarPath, 'utf8')) : []

export default defineConfig({
  title: '@kaelyx/ts-kit',
  description: 'Small TypeScript utility functions with no dependencies at run time.',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
    ],
    sidebar: {
      '/api/': [
        {
          text: 'API',
          items: typedocSidebar,
        },
      ],
      '/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Scripts', link: '/guide/scripts' },
            { text: 'Adding a function', link: '/guide/adding-a-function' },
            { text: 'Changesets and releases', link: '/guide/changesets-and-releases' },
          ],
        },
        {
          text: 'Project policies',
          items: [
            { text: 'Contributing', link: '/contributing' },
            { text: 'AI policy', link: '/ai-policy' },
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
