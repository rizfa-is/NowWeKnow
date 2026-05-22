<script setup lang="ts">
import { motion } from 'motion-v'

const props = withDefaults(defineProps<{
  listening: boolean
  supported: boolean
  disabled?: boolean
  size?: 'md' | 'lg'
}>(), {
  size: 'lg',
  disabled: false,
})

const emit = defineEmits<{
  press: []
}>()

function onPress() {
  if (props.disabled) return
  emit('press')
}
</script>

<template>
  <button
    type="button"
    class="mic-button"
    :class="[`is-${size}`, { 'is-listening': listening, 'is-unsupported': !supported, 'is-disabled': disabled }]"
    :disabled="disabled"
    :aria-pressed="listening"
    :aria-label="listening ? 'Listening' : 'Tap and speak'"
    @click="onPress"
  >
    <motion.span
      v-if="listening"
      class="mic-button__pulse"
      :animate="{ scale: [1, 1.5, 1], opacity: [0.55, 0, 0.55] }"
      :transition="{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }"
      aria-hidden="true"
    />
    <span class="mic-button__core" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.mic-button {
  position: relative;
  display: inline-grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  color: var(--color-white);
  background: var(--color-accent);
  box-shadow: var(--shadow-pop);
  transition: transform 0.15s ease;
}
.mic-button.is-md {
  width: 56px;
  height: 56px;
}
.mic-button.is-lg {
  width: 96px;
  height: 96px;
}
.mic-button:not(.is-disabled):active {
  transform: scale(0.96);
}
.mic-button.is-disabled,
.mic-button.is-unsupported {
  background: var(--color-fg-muted);
  cursor: not-allowed;
  box-shadow: none;
}
.mic-button.is-listening {
  background: var(--color-error);
}
.mic-button__pulse {
  position: absolute;
  inset: -10px;
  border-radius: 999px;
  background: var(--color-error);
  z-index: 0;
}
.mic-button__core {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
}
</style>
