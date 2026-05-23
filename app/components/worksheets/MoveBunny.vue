<script setup lang="ts">
import { motion } from 'motion-v'
import type { LocalizedString, PhraseDictionary, WorksheetMeta } from '~/types/worksheet'

interface MovePrompt {
  steps: number // how many "right" steps to reach the carrot
}

interface MoveData {
  prompts: MovePrompt[]
  trackSize?: number // total cells on the track, defaults to 6
}

const props = defineProps<{
  worksheet: WorksheetMeta
}>()

const data = computed(() => props.worksheet.data as unknown as MoveData)
const prompts = computed(() => data.value?.prompts ?? [])
const trackSize = computed(() => data.value?.trackSize ?? 6)

const locale = useLocale()
const voice = useVoice()

const stepIndex = ref(0)
const feedback = ref<'idle' | 'correct' | 'wrong'>('idle')
const showHint = ref(false)
const bunnyPos = ref(0)

const current = computed(() => prompts.value[stepIndex.value])
const done = computed(() => stepIndex.value >= prompts.value.length)
const target = computed(() => current.value?.steps ?? 0)

const movePhrases: PhraseDictionary = {
  right: { en: ['right', 'forward', 'go', 'move'], id: ['kanan', 'maju'] },
  left: { en: ['left', 'back', 'backward'], id: ['kiri', 'mundur'] },
}

const promptCopy = computed<LocalizedString>(() => ({
  en: `Land exactly on the carrot. Say "right" or tap →`,
  id: `Berhenti tepat di wortel. Sebutkan "kanan" atau sentuh →`,
}))

const remaining = computed(() => target.value - bunnyPos.value)
const hint = computed<LocalizedString>(() => {
  if (remaining.value < 0) {
    return {
      en: `You went past the carrot. Say "left" to step back.`,
      id: `Kelebihan langkah. Ucapkan "kiri" untuk mundur.`,
    }
  }
  return {
    en: `${remaining.value} more step${remaining.value === 1 ? '' : 's'} to go.`,
    id: `${remaining.value} langkah lagi.`,
  }
})

const tapToTalk = computed(() => (locale.value === 'id' ? 'Tekan dan bicara' : 'Tap to speak'))
const completeMsg = computed(() => (locale.value === 'id'
  ? 'Yay! Kelinci dapat wortelnya.'
  : 'Yay! Bunny got the carrot.'))

watch(stepIndex, () => {
  bunnyPos.value = 0
  voice.reset()
  showHint.value = false
})

function moveOne(dir: 'right' | 'left') {
  if (feedback.value === 'correct') return
  if (dir === 'right') bunnyPos.value = Math.min(trackSize.value - 1, bunnyPos.value + 1)
  else bunnyPos.value = Math.max(0, bunnyPos.value - 1)

  if (bunnyPos.value === target.value) {
    feedback.value = 'correct'
    setTimeout(() => {
      feedback.value = 'idle'
      stepIndex.value += 1
    }, 1100)
  }
  else if (bunnyPos.value > target.value) {
    feedback.value = 'wrong'
    setTimeout(() => { feedback.value = 'idle' }, 700)
  }
}

function onListenPress() {
  if (voice.isListening.value) {
    voice.stop()
    return
  }
  voice.listen()
}

watch(voice.resultCount, (n) => {
  if (n === 0) return
  const result = voice.evaluate(movePhrases)
  if (result.matched === 'right' || result.matched === 'left') {
    moveOne(result.matched as 'right' | 'left')
  }
  else {
    feedback.value = 'wrong'
    setTimeout(() => { feedback.value = 'idle' }, 600)
  }
})
</script>

<template>
  <WorksheetShell
    :title="worksheet.title"
    :type="worksheet.type"
    :steps="prompts.length"
    :current="stepIndex"
    :feedback="feedback"
    :hint="showHint ? hint : null"
    @hint="showHint = !showHint"
  >
    <div v-if="!done" class="mv">
      <p class="mv__prompt">{{ promptCopy[locale] }}</p>

      <div class="mv__track" :style="{ '--cells': trackSize }">
        <div
          v-for="i in trackSize"
          :key="i"
          class="mv__cell"
          :class="{ 'is-target': i - 1 === target, 'is-bunny': i - 1 === bunnyPos }"
        >
          <motion.span
            v-if="i - 1 === bunnyPos"
            layout-id="bunny"
            class="mv__bunny"
            :transition="{ type: 'spring', stiffness: 360, damping: 26 }"
          >
            🐰
          </motion.span>
          <span v-else-if="i - 1 === target" class="mv__cell-icon" aria-label="carrot">🥕</span>
        </div>
      </div>

      <div class="mv__voice">
        <MicButton
          :listening="voice.isListening.value"
          :supported="voice.isSupported.value"
          @press="onListenPress"
        />
        <p class="mv__voice-label">
          {{ voice.isListening.value ? '...' : tapToTalk }}
        </p>
        <p v-if="voice.transcript.value" class="mv__transcript">
          "{{ voice.transcript.value }}"
        </p>
      </div>

      <div class="mv__pad">
        <button type="button" class="mv__pad-btn" :aria-label="locale === 'id' ? 'Mundur' : 'Step left'" @click="moveOne('left')">←</button>
        <button type="button" class="mv__pad-btn is-primary" :aria-label="locale === 'id' ? 'Maju' : 'Step right'" @click="moveOne('right')">→</button>
      </div>
    </div>

    <div v-else class="mv__done">
      <motion.div
        class="mv__done-emoji"
        :animate="{ y: [0, -10, 0] }"
        :transition="{ duration: 0.8, repeat: Infinity }"
      >
        🐰🥕
      </motion.div>
      <h2>{{ completeMsg }}</h2>
      <NuxtLink to="/" class="mv__home-btn">
        {{ locale === 'id' ? 'Kembali' : 'Back home' }}
      </NuxtLink>
    </div>
  </WorksheetShell>
</template>

<style scoped>
.mv {
  display: grid;
  gap: 1.25rem;
  justify-items: center;
  width: 100%;
  max-width: 720px;
}
.mv__prompt {
  font-family: var(--font-display);
  font-size: clamp(1rem, 2vw, 1.4rem);
  font-weight: 600;
  margin: 0;
  text-align: center;
}

.mv__track {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(var(--cells), 1fr);
  gap: clamp(4px, 1vw, 8px);
  background: var(--color-bg-deep);
  border-radius: var(--radius-md);
  padding: clamp(0.5rem, 1.5vw, 1rem);
}
.mv__cell {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  display: grid;
  place-items: center;
  font-size: clamp(1.25rem, 4vw, 2rem);
  transition: background 0.2s, transform 0.2s;
}
.mv__cell.is-target {
  background: var(--color-accent-soft);
  border: 2px dashed var(--color-accent);
}
.mv__cell.is-bunny {
  background: var(--color-success);
}
.mv__cell.is-bunny.is-target {
  background: var(--color-success);
  border-color: var(--color-success);
}
.mv__bunny {
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  display: inline-block;
}

.mv__voice {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
}
.mv__voice-label {
  font-family: var(--font-display);
  font-weight: 600;
  margin: 0;
}
.mv__transcript {
  margin: 0;
  color: var(--color-fg-muted);
  font-style: italic;
  text-transform: capitalize;
}

.mv__pad {
  display: flex;
  gap: 1rem;
}
.mv__pad-btn {
  width: clamp(72px, 16vw, 96px);
  height: clamp(72px, 16vw, 96px);
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-fg);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  box-shadow: var(--shadow-card);
  transition: transform 0.15s;
}
.mv__pad-btn.is-primary {
  background: var(--color-accent);
  color: var(--color-white);
}
.mv__pad-btn:active {
  transform: scale(0.94);
}

.mv__done {
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 1.5rem;
}
.mv__done-emoji {
  font-size: clamp(2.5rem, 8vw, 4rem);
  letter-spacing: 0.5rem;
}
.mv__home-btn {
  padding: 0.85rem 1.75rem;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-white);
  font-family: var(--font-display);
  font-weight: 600;
}
</style>
