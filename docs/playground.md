---
layout: page
sidebar: false
aside: false
outline: false
title: Playground
---

<script setup>
import { defineAsyncComponent } from 'vue'

// The playground is large, so it loads only on this page.
const Playground = defineAsyncComponent(() => import('./.vitepress/components/Playground.vue'))
</script>

<Playground />
