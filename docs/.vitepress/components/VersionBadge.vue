<script setup lang="ts">
// The version comes from package.json at build time, so it matches the release the site was
// built from.
import { version } from '../../../package.json'
</script>

<template>
  <p class="version">
    Latest release
    <a :href="`https://www.npmjs.com/package/@kaelyx/ts-kit/v/${version}`" target="_blank" rel="noreferrer">
      {{ version }}
    </a>
    ·
    <a href="https://github.com/kaelyx-dev/ts-kit/blob/main/CHANGELOG.md" target="_blank" rel="noreferrer">
      changelog
    </a>
  </p>
</template>

<style scoped>
.version {
  margin-top: 20px;
  color: var(--vp-c-text-3);
  font-size: 14px;
}

.version a {
  color: var(--vp-c-text-2);
  text-decoration: underline;
  text-decoration-color: var(--vp-c-divider);
  text-underline-offset: 3px;
}

.version a:hover {
  color: var(--vp-c-brand-1);
  text-decoration-color: currentColor;
}
</style>
