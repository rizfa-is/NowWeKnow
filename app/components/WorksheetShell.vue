<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v'
import type { LocalizedString, WorksheetType } from '~/types/worksheet'

const props = defineProps<{
  title: LocalizedString
  steps: number
  current: number
  /** Worksheet type — drives the per-type instructions overlay. */
  type: WorksheetType
  feedback?: 'correct' | 'wrong' | 'idle'
  hint?: LocalizedString | null
}>()

defineEmits<{
  exit: []
  hint: []
}>()

const locale = useLocale()
const router = useRouter()

const titleText = computed(() => props.title[locale.value])
const hintText = computed(() => (props.hint ? props.hint[locale.value] : ''))

const exitLabel = computed(() => (locale.value === 'id' ? 'Keluar' : 'Exit'))
const hintLabel = computed(() => (locale.value === 'id' ? 'Petunjuk' : 'Hint'))
const helpLabel = computed(() => (locale.value === 'id' ? 'Cara main' : 'How to play'))

// Auto-show the intro overlay on first mount of each worksheet.
const introOpen = ref(true)

function onExit() {
  router.push('/')
}
</script>

<template>
  <section class="shell">
    <header class="shell__top">
      <button type="button" class="shell__exit" @click="onExit">
        <span aria-hidden="true">←</span>
        <span class="shell__exit-text">{{ exitLabel }}</span>
      </button>

      <div class="shell__title-block">
        <h1 class="shell__title">{{ titleText }}</h1>
        <ProgressDots :steps="steps" :current="current" />
      </div>

      <div class="shell__top-actions">
        <button
          type="button"
          class="shell__help"
          :aria-label="helpLabel"
          :title="helpLabel"
          @click="introOpen = true"
        >
          ?
        </button>
        <LocaleToggle />
      </div>
    </header>

    <div class="shell__stage">
      <AnimatePresence>
        <motion.div
          v-if="feedback && feedback !== 'idle'"
          :key="`fb-${current}-${feedback}`"
          class="shell__feedback"
          :class="`is-${feedback}`"
          :initial="{ opacity: 0, scale: 0.85 }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{ opacity: 0, scale: 0.85 }"
          :transition="{ duration: 0.25 }"
          aria-live="polite"
        >
          <span v-if="feedback === 'correct'">✓</span>
          <span v-else>!</span>
        </motion.div>
      </AnimatePresence>

      <slot />
    </div>

    <footer v-if="hint" class="shell__hint-bar">
      <button type="button" class="shell__hint-btn" @click="$emit('hint')">
        💡 {{ hintLabel }}
      </button>
      <p v-if="hintText" class="shell__hint-text">{{ hintText }}</p>
    </footer>

    <WorksheetIntro
      :open="introOpen"
      :type="type"
      :title="title"
      @close="introOpen = false"
    />
  </section>
</template>

<style scoped>
.shell {
  position: relative;
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: var(--color-bg);
  color: var(--color-fg);
}
.shell__top {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: clamp(0.5rem, 2vw, 1.5rem);
  padding: clamp(0.75rem, 2.5vw, 1.25rem) clamp(0.75rem, 3vw, 1.75rem);
  border-bottom: 1px solid rgba(31, 37, 64, 0.06);
  background: var(--color-surface);
}
.shell__exit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 clamp(0.75rem, 2vw, 1rem);
  height: 44px;
  min-height: 44px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-fg-muted);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(0.85rem, 2.2vw, 1rem);
}
.shell__exit:hover {
  background: var(--color-bg);
}
.shell__exit-text {
  display: inline;
}
@media (max-width: 520px) {
  .shell__exit-text {
    display: none;
  }
}
.shell__title-block {
  text-align: center;
  display: grid;
  gap: 0.4rem;
  justify-items: center;
  min-width: 0;
}
.shell__title {
  font-size: clamp(1rem, 3vw, 1.75rem);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.shell__top-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.shell__help {
  width: 44px;
  height: 44px;
  min-height: 44px;
  min-width: 44px;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent-soft);
  color: var(--color-fg);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.2rem;
  display: grid;
  place-items: center;
}
.shell__help:hover {
  background: var(--color-accent);
  color: var(--color-white);
}
.shell__stage {
  position: relative;
  display: grid;
  place-items: center;
  padding: clamp(1rem, 3vw, 2rem);
  overflow: hidden;
}
.shell__feedback {
  position: absolute;
  top: 1rem;
  z-index: 5;
  width: clamp(72px, 16vw, 96px);
  height: clamp(72px, 16vw, 96px);
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 3rem);
  color: var(--color-white);
  pointer-events: none;
}
.shell__feedback.is-correct {
  background: var(--color-success);
}
.shell__feedback.is-wrong {
  background: var(--color-error);
}
.shell__hint-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: clamp(0.75rem, 2vw, 1rem) clamp(0.75rem, 2.5vw, 1.5rem);
  background: var(--color-surface);
  border-top: 1px solid rgba(31, 37, 64, 0.06);
  flex-wrap: wrap;
}
.shell__hint-btn {
  flex-shrink: 0;
  height: 44px;
  min-height: 44px;
  padding: 0 1.1rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent-soft);
  color: var(--color-fg);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(0.85rem, 2.2vw, 1rem);
}
.shell__hint-text {
  margin: 0;
  color: var(--color-fg-muted);
  font-size: clamp(0.85rem, 2.2vw, 1rem);
}
</style>
