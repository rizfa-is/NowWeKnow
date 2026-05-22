<script setup lang="ts">
defineProps<{ icon?: string }>()
</script>

<template>
  <aside class="callout">
    <slot />
  </aside>
</template>

<style scoped>
.callout {
  position: relative;
  margin: 2rem 0;
  padding: 1.25rem 1.5rem;
  border-left: 2px solid var(--color-accent);
  background: rgba(246, 206, 160, 0.06);
  font-style: italic;
  color: var(--color-fg);
}
</style>
