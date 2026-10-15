<script setup lang="ts">
import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackLayout,
  SandpackProvider,
} from 'sandpack-vue3'
import { useData } from 'vitepress'
import { computed } from 'vue'

const props = defineProps<{ code: string; version: string }>()
const { isDark } = useData()

// With no preview pane, Sandpack has nowhere to show an uncaught error. This hidden entry runs
// the example and sends any error to the console instead. It is CommonJS, like the bundled code.
const RUN_JS = `window.addEventListener('error', (event) => console.error(event.error ?? event.message))
window.addEventListener('unhandledrejection', (event) => console.error(event.reason))
try {
  require('./index.ts')
} catch (error) {
  console.error(error)
}
`

// The template's index.html loads index.ts with a <script> tag. This copy has no script, so the
// example runs once, through /run.js.
const INDEX_HTML = '<!DOCTYPE html>\n<html>\n  <body></body>\n</html>\n'

const files = computed(() => ({
  '/index.ts': { code: props.code, active: true },
  '/run.js': { code: RUN_JS, hidden: true },
  '/index.html': { code: INDEX_HTML, hidden: true },
}))

const customSetup = computed(() => ({
  entry: '/run.js',
  dependencies: { '@kaelyx/ts-kit': props.version },
}))
</script>

<template>
  <SandpackProvider
    template="vanilla-ts"
    :files="files"
    :custom-setup="customSetup"
    :theme="isDark ? 'dark' : 'light'"
    :options="{ visibleFiles: ['/index.ts'], activeFile: '/index.ts' }"
  >
    <SandpackLayout class="playground-sandbox">
      <SandpackCodeEditor :show-tabs="false" show-line-numbers />
      <SandpackConsole standalone show-syntax-error :show-header="false" />
    </SandpackLayout>
  </SandpackProvider>
</template>

<style>
/* Stack the editor above the console, and let both grow with their content instead of
   scrolling inside Sandpack's fixed 300px panels. */
.playground-sandbox {
  flex-direction: column;
}

.playground-sandbox > .sp-stack {
  flex: none !important;
  height: auto !important;
}

.playground-sandbox .sp-code-editor .cm-scroller {
  overflow: visible;
}

.playground-sandbox .sp-console {
  position: relative;
  min-height: 96px;
}

.playground-sandbox .sp-console-list {
  overflow: visible;
  /* Room for the clear button, which Sandpack positions at the bottom right. */
  padding-bottom: 40px;
}
</style>
