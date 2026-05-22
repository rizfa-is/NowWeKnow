<script setup lang="ts">
import { useLoader } from '~/composables/useLoader'

const { progress, ready } = useLoader()
</script>

<template>
  <div class="app">
    <Loader v-if="!ready" :progress="progress" />
    <NuxtPage v-else />
  </div>
</template>

<style>
.app {
  position: relative;
  min-height: 100dvh;
  background: var(--color-bg);
  color: var(--color-fg);
}
</style>
