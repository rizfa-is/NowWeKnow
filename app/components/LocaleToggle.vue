<script setup lang="ts">
import type { Locale } from '~/types/worksheet'

const locale = useLocale()

function set(value: Locale) {
  locale.value = value
}
</script>

<template>
  <div class="locale-toggle" role="group" aria-label="Language">
    <button
      type="button"
      class="locale-toggle__btn"
      :class="{ 'is-active': locale === 'en' }"
      :aria-pressed="locale === 'en'"
      @click="set('en')"
    >
      EN
    </button>
    <button
      type="button"
      class="locale-toggle__btn"
      :class="{ 'is-active': locale === 'id' }"
      :aria-pressed="locale === 'id'"
      @click="set('id')"
    >
      ID
    </button>
  </div>
</template>

<style scoped>
.locale-toggle {
  display: inline-flex;
  background: var(--color-surface);
  border-radius: 999px;
  padding: 4px;
  box-shadow: var(--shadow-card);
}
.locale-toggle__btn {
  min-height: 40px;
  min-width: 56px;
  padding: 0 1rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-fg-muted);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  transition: background 0.18s, color 0.18s;
}
.locale-toggle__btn.is-active {
  background: var(--color-accent);
  color: var(--color-white);
}
</style>
