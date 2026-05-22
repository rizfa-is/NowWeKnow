<script setup lang="ts">
import { motion } from 'motion-v'

defineProps<{
  kicker: string
  title: string
  accent?: boolean
}>()
</script>

<template>
  <section class="panel" :class="{ 'panel--accent': accent }">
    <div class="panel__inner">
      <motion.p
        class="panel__kicker"
        :initial="{ opacity: 0, x: -20 }"
        :whileInView="{ opacity: 1, x: 0 }"
        :viewport="{ once: false, margin: '-30%' }"
        :transition="{ duration: 0.6 }"
      >
        {{ kicker }}
      </motion.p>

      <motion.h2
        class="panel__title"
        :initial="{ opacity: 0, y: 30 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: false, margin: '-30%' }"
        :transition="{ duration: 0.7, delay: 0.1 }"
      >
        {{ title }}
      </motion.h2>

      <motion.div
        class="panel__copy"
        :initial="{ opacity: 0, y: 20 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: false, margin: '-25%' }"
        :transition="{ duration: 0.7, delay: 0.2 }"
      >
        <slot />
      </motion.div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  min-height: 100dvh;
  padding: 6rem 2rem;
  display: flex;
  align-items: center;
}

.panel__inner {
  max-width: 480px;
  margin-left: clamp(1rem, 8vw, 6rem);
  background: rgba(5, 10, 24, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 2.25rem 2rem;
  border-radius: 4px;
}

.panel__kicker {
  margin: 0 0 1rem;
  font-size: 0.75rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.panel__title {
  font-size: clamp(1.75rem, 3.5vw, 2.6rem);
  font-weight: 500;
  margin: 0 0 1.25rem;
  line-height: 1.15;
}

.panel__copy {
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--color-fg);
}

.panel__copy :deep(em) {
  color: var(--color-accent);
  font-style: italic;
}

.panel--accent .panel__inner {
  border-color: var(--color-accent);
  box-shadow: 0 0 60px rgba(246, 206, 160, 0.12);
}

@media (max-width: 720px) {
  .panel__inner {
    margin: 0 auto;
    max-width: 100%;
  }
}
</style>
