<script setup lang="ts">
const { steps, current } = defineProps<{
  steps: number
  current: number
}>()
</script>

<template>
  <ol class="progress-dots" :aria-label="`Step ${current + 1} of ${steps}`">
    <li
      v-for="i in steps"
      :key="i"
      class="progress-dots__dot"
      :class="{
        'is-done': i - 1 < current,
        'is-active': i - 1 === current,
      }"
    />
  </ol>
</template>

<style scoped>
.progress-dots {
  display: inline-flex;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.progress-dots__dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: rgba(31, 37, 64, 0.16);
  transition: background 0.25s, transform 0.25s;
}
.progress-dots__dot.is-active {
  background: var(--color-accent);
  transform: scale(1.25);
}
.progress-dots__dot.is-done {
  background: var(--color-success);
}
</style>
