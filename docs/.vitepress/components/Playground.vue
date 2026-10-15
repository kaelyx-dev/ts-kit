<script setup lang="ts">
import { withBase } from 'vitepress'
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import { type PlaygroundFunction, data } from '../data/playground.data.mts'

// Sandpack touches `window` when it loads, so it is only imported in the browser.
const PlaygroundSandbox = defineAsyncComponent(() => import('./PlaygroundSandbox.vue'))

const DEFAULT_CODE = `import { clamp, sum, template, truncate } from '@kaelyx/ts-kit'

// Select a function on the left to load its example, or edit this code.
console.log(sum([1, 2, 3])) // 6
console.log(clamp(15, { min: 1, max: 10 })) // 10
console.log(truncate('hello world', 5)) // 'hello'
console.log(template('Hello, {{name}}!', { name: 'Ada' })) // 'Hello, Ada!'
`

const functions = data.categories.flatMap((c) => c.functions)
const search = ref('')
const selected = ref<PlaygroundFunction | undefined>()
const code = ref(DEFAULT_CODE)
// Sandpack reads the files only when it mounts, so a new key makes it load new code.
const key = ref(0)

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return data.categories
    .map((category) => ({
      ...category,
      functions: category.functions.filter(
        (fn) => query === '' || fn.name.toLowerCase().includes(query),
      ),
    }))
    .filter((category) => category.functions.length > 0)
})

const load = (fn: PlaygroundFunction | undefined): void => {
  selected.value = fn
  code.value = fn?.code ?? DEFAULT_CODE
  key.value++
}

const select = (fn: PlaygroundFunction): void => {
  load(fn)
  history.replaceState(null, '', `#${fn.name}`)
}

const reset = (): void => load(selected.value)

const readHash = (): void => {
  const name = decodeURIComponent(location.hash.slice(1))
  const fn = functions.find((f) => f.name === name)
  if (fn && fn !== selected.value) load(fn)
}

onMounted(() => {
  readHash()
  window.addEventListener('hashchange', readHash)
})
onUnmounted(() => window.removeEventListener('hashchange', readHash))
</script>

<template>
  <div class="playground">
    <nav class="sidebar" aria-label="Functions">
      <input
        v-model="search"
        class="search"
        type="search"
        placeholder="Search functions"
        aria-label="Search functions"
      />
      <div v-for="category in filtered" :key="category.name" class="category">
        <h2 class="category-name">{{ category.name }}</h2>
        <ul>
          <li v-for="fn in category.functions" :key="fn.name">
            <button
              type="button"
              class="function"
              :class="{ active: fn === selected }"
              :aria-current="fn === selected ? 'true' : undefined"
              @click="select(fn)"
            >
              {{ fn.name }}
            </button>
          </li>
        </ul>
      </div>
      <p v-if="filtered.length === 0" class="empty">No function matches "{{ search }}".</p>
    </nav>

    <section class="main">
      <header class="header">
        <div>
          <h1 class="title">{{ selected?.name ?? 'Playground' }}</h1>
          <p class="summary">
            {{
              selected?.summary ??
              `Run @kaelyx/ts-kit ${data.version} in your browser. The code runs in a CodeSandbox sandbox.`
            }}
          </p>
        </div>
        <div class="actions">
          <a
            v-if="selected"
            class="button"
            :href="withBase(`/api/${selected.category}/functions/${selected.name}`)"
          >
            API reference
          </a>
          <button type="button" class="button" @click="reset">Reset</button>
        </div>
      </header>

      <ClientOnly>
        <PlaygroundSandbox :key="key" :code="code" :version="data.version" />
      </ClientOnly>
    </section>
  </div>
</template>

<style scoped>
.playground {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
}

.sidebar {
  position: sticky;
  top: calc(var(--vp-nav-height) + 24px);
  align-self: start;
  max-height: calc(100vh - var(--vp-nav-height) - 48px);
  overflow-y: auto;
}

.search {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  font-size: 14px;
}

.category {
  margin-top: 16px;
}

.category-name {
  margin: 0 0 4px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.category ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.function {
  display: block;
  width: 100%;
  padding: 3px 8px;
  border-radius: 4px;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  text-align: left;
  overflow-wrap: anywhere;
}

.function:hover {
  background: var(--vp-c-default-soft);
}

.function.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.empty {
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.header {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.title {
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 24px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.summary {
  margin: 4px 0 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 8px;
}

.button {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  text-decoration: none;
  white-space: nowrap;
}

.button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.search:focus-visible,
.function:focus-visible,
.button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

@media (max-width: 767px) {
  .playground {
    grid-template-columns: minmax(0, 1fr);
    padding: 16px;
  }

  .sidebar {
    position: static;
    max-height: 240px;
  }
}
</style>
