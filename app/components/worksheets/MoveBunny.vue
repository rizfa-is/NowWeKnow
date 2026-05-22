<script setup lang="ts">
import { motion } from 'motion-v'
import type { Locale, LocalizedString, PhraseDictionary, WorksheetMeta } from '~/types/worksheet'

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
  en: `Move the bunny to the carrot. Say "right" or tap →`,
  id: `Pindahkan kelinci ke wortel. Sebutkan "kanan" atau sentuh →`,
}))

const hint = computed<LocalizedString>(() => ({
  en: `${target.value - bunnyPos.value} more step${target.value - bunnyPos.value === 1 ? '' : 's'} to go.`,
  id: `${target.value - bunnyPos.value} langkah lagi.`,
}))

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
  if (dir === 'right') bunnyPos.value = Math.min(trackSize.value - 1, bunnyPos.value + 1)
  else bunnyPos.value = Math.max(0, bunnyPos.value - 1)

  if (bunnyPos.value === target.value) {
    feedback.value = 'correct'
    setTimeout(() => {
      feedback.value = 'idle'
      stepIndex.value += 1
    }, 900)
  }
  else if (bunnyPos.value > target.value) {
    feedback.value = 'wrong'
    setTimeout(() => {
      feedback.value = 'idle'
    }, 700)
  }
}

function onListenPress() {
  if (voice.isListening.value) {
    voice.stop()
    return
  }
  voice.listen()
}

watch(voice.isFinal, (final) => {
  if (!final) return
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
          :class="{ 'is-target': i - 1 === target }"
        >
          <span v-if="i - 1 === target" class="mv__cell-icon">🥕</span>
        </div>
        <motion.div
          class="mv__bunny"
          :animate="{ x: `calc(${bunnyPos} * (100% / ${trackSize}))` }"
          :transition="{ type: 'spring', stiffness: 320, damping: 22 }"
        >
          🐰
        </motion.div>
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
        <button type="button" class="mv__pad-btn" @click="moveOne('left')">←</button>
        <button type="button" class="mv__pad-btn is-primary" @click="moveOne('right')">→</button>
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
  gap: 1.5rem;
  justify-items: center;
  width: 100%;
  max-width: 800px;
}
.mv__prompt {
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  font-weight: 600;
  margin: 0;
  text-align: center;
}

.mv__track {
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(var(--cells), 1fr);
  gap: 6px;
  background: var(--color-bg-deep);
  border-radius: var(--radius-md);
  padding: 1rem;
}
.mv__cell {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  display: grid;
  place-items: center;
  font-size: 2rem;
}
.mv__cell.is-target {
  background: var(--color-accent-soft);
  border: 2px dashed var(--color-accent);
}
.mv__bunny {
  position: absolute;
  top: 50%;
  left: calc(1rem + 6px);
  transform: translateY(-50%);
  font-size: clamp(2rem, 5vw, 3rem);
  width: calc((100% - 2rem - 6px * (var(--cells) - 1)) / var(--cells));
  display: grid;
  place-items: center;
  pointer-events: none;
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
  width: 96px;
  height: 96px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-fg);
  font-size: 2.5rem;
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
  font-size: 3.5rem;
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
