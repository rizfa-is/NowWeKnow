<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v'
import type { LocalizedString, WorksheetType } from '~/types/worksheet'

const props = defineProps<{
  open: boolean
  type: WorksheetType
  title: LocalizedString
}>()

defineEmits<{
  close: []
}>()

const locale = useLocale()
const { goal, steps, tips } = useIntro(props.type)

const titleText = computed(() => props.title[locale.value])
const startLabel = computed(() => (locale.value === 'id' ? 'Ayo mulai' : "Let's start"))
const tipsLabel = computed(() => (locale.value === 'id' ? 'Coba ucapkan' : 'Try saying'))
const goalLabel = computed(() => (locale.value === 'id' ? 'Tujuan' : 'Goal'))
const howLabel = computed(() => (locale.value === 'id' ? 'Cara main' : 'How to play'))
</script>

<template>
  <AnimatePresence>
    <motion.div
      v-if="open"
      class="intro"
      role="dialog"
      aria-modal="true"
      :aria-label="howLabel"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :exit="{ opacity: 0 }"
      :transition="{ duration: 0.2 }"
    >
      <div class="intro__scrim" @click="$emit('close')" />

      <motion.div
        class="intro__panel"
        :initial="{ opacity: 0, y: 24, scale: 0.96 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :exit="{ opacity: 0, y: 24, scale: 0.96 }"
        :transition="{ type: 'spring', stiffness: 260, damping: 24 }"
      >
        <header class="intro__head">
          <p class="intro__eyebrow">{{ howLabel }}</p>
          <h2 class="intro__title">{{ titleText }}</h2>
        </header>

        <section class="intro__goal">
          <span class="intro__goal-label">{{ goalLabel }}</span>
          <p class="intro__goal-text">{{ goal }}</p>
        </section>

        <ol class="intro__steps">
          <li v-for="(step, i) in steps" :key="i" class="intro__step">
            <span class="intro__step-icon">{{ step.icon }}</span>
            <span class="intro__step-num">{{ i + 1 }}</span>
            <span class="intro__step-text">{{ step.text }}</span>
          </li>
        </ol>

        <section v-if="tips.length" class="intro__tips">
          <span class="intro__tips-label">🎤 {{ tipsLabel }}</span>
          <ul class="intro__tips-list">
            <li v-for="t in tips" :key="t" class="intro__tip">{{ t }}</li>
          </ul>
        </section>

        <button type="button" class="intro__cta" @click="$emit('close')">
          {{ startLabel }} →
        </button>
      </motion.div>
    </motion.div>
  </AnimatePresence>
</template>

<style scoped>
.intro {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 1.5rem;
}
.intro__scrim {
  position: absolute;
  inset: 0;
  background: rgba(31, 37, 64, 0.55);
  backdrop-filter: blur(4px);
}
.intro__panel {
  position: relative;
  width: 100%;
  max-width: 560px;
  max-height: calc(100dvh - 3rem);
  overflow-y: auto;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-pop);
  padding: 1.75rem;
  display: grid;
  gap: 1.25rem;
}
.intro__head {
  display: grid;
  gap: 0.25rem;
}
.intro__eyebrow {
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-fg-muted);
  margin: 0;
}
.intro__title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
}

.intro__goal {
  background: var(--color-accent-soft);
  border-radius: var(--radius-md);
  padding: 0.85rem 1.1rem;
}
.intro__goal-label {
  display: block;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-fg-muted);
  margin-bottom: 0.25rem;
}
.intro__goal-text {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.1rem;
}

.intro__steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.65rem;
}
.intro__step {
  display: grid;
  grid-template-columns: 40px 32px 1fr;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.25rem;
  border-bottom: 1px dashed rgba(31, 37, 64, 0.08);
}
.intro__step:last-child {
  border-bottom: 0;
}
.intro__step-icon {
  font-size: 1.75rem;
  line-height: 1;
}
.intro__step-num {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-white);
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
}
.intro__step-text {
  font-size: 1rem;
  line-height: 1.4;
}

.intro__tips {
  background: var(--color-bg-deep);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
}
.intro__tips-label {
  display: block;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}
.intro__tips-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.intro__tip {
  padding: 0.3rem 0.7rem;
  background: var(--color-surface);
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.9rem;
}

.intro__cta {
  height: 56px;
  padding: 0 1.5rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-success);
  color: var(--color-white);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.04em;
  box-shadow: var(--shadow-card);
  justify-self: center;
  min-width: 220px;
}
.intro__cta:active {
  transform: scale(0.97);
}
</style>
