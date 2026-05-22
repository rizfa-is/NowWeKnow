<script setup lang="ts">
import { motion } from 'motion-v'
import type { Locale, LocalizedString, PhraseDictionary, WorksheetMeta } from '~/types/worksheet'

interface ColorPrompt {
  color: string
  shape?: 'circle' | 'square' | 'triangle' | 'star' | 'heart'
}

interface ColorData {
  prompts: ColorPrompt[]
}

const props = defineProps<{
  worksheet: WorksheetMeta
}>()

const data = computed(() => props.worksheet.data as unknown as ColorData)
const prompts = computed(() => data.value?.prompts ?? [])

const voice = useVoice()
const locale = useLocale()

const stepIndex = ref(0)
const feedback = ref<'idle' | 'correct' | 'wrong'>('idle')
const showHint = ref(false)

const current = computed(() => prompts.value[stepIndex.value])
const done = computed(() => stepIndex.value >= prompts.value.length)

// Bilingual color phrase dictionary. Keyed by canonical English color name.
const colorPhrases: PhraseDictionary = {
  red: { en: ['red'], id: ['merah'] },
  orange: { en: ['orange'], id: ['oranye', 'jingga'] },
  yellow: { en: ['yellow'], id: ['kuning'] },
  green: { en: ['green'], id: ['hijau'] },
  blue: { en: ['blue'], id: ['biru'] },
  purple: { en: ['purple'], id: ['ungu'] },
  pink: { en: ['pink'], id: ['merah muda', 'pink'] },
  brown: { en: ['brown'], id: ['coklat', 'cokelat'] },
  black: { en: ['black'], id: ['hitam'] },
  white: { en: ['white'], id: ['putih'] },
}

const choiceColors = computed(() => {
  const all = Object.keys(colorPhrases)
  const correct = current.value?.color
  if (!correct) return []
  // 4 distractors max, always include the correct one
  const distractors = all.filter(c => c !== correct).sort(() => Math.random() - 0.5).slice(0, 3)
  return [correct, ...distractors].sort(() => Math.random() - 0.5)
})

const promptText = computed<Record<Locale, string>>(() => ({
  en: 'What color is this shape?',
  id: 'Apa warna bentuk ini?',
}))

const hint = computed<LocalizedString>(() => ({
  en: `Try saying the color in English. The answer is "${current.value?.color ?? ''}".`,
  id: `Coba sebutkan warnanya. Jawabannya "${labelFor(current.value?.color ?? '', 'id')}".`,
}))

function labelFor(color: string, loc: Locale): string {
  const phrases = colorPhrases[color]?.[loc] ?? []
  return phrases[0] ?? color
}

function nextStep(outcome: 'correct' | 'wrong') {
  feedback.value = outcome
  if (outcome === 'correct') {
    setTimeout(() => {
      feedback.value = 'idle'
      stepIndex.value += 1
      voice.reset()
      showHint.value = false
    }, 900)
  }
  else {
    setTimeout(() => {
      feedback.value = 'idle'
    }, 900)
  }
}

function onListenPress() {
  if (voice.isListening.value) {
    voice.stop()
    return
  }
  voice.listen()
}

function onTouchAnswer(color: string) {
  if (color === current.value?.color) nextStep('correct')
  else nextStep('wrong')
}

// Watch for voice answers
watch(voice.isFinal, (final) => {
  if (!final) return
  const result = voice.evaluate(colorPhrases)
  if (!result.matched) {
    nextStep('wrong')
    return
  }
  if (result.matched === current.value?.color) nextStep('correct')
  else nextStep('wrong')
})

const completeMsg = computed(() => (locale.value === 'id'
  ? 'Hebat! Semua warna terjawab.'
  : 'Great job! All colors named.'))

const tapToTalk = computed(() => (locale.value === 'id' ? 'Tekan dan bicara' : 'Tap to speak'))
const orTap = computed(() => (locale.value === 'id' ? 'atau pilih warna' : 'or pick a color'))

function shapeFill(color: string): string {
  const map: Record<string, string> = {
    red: 'var(--color-red)',
    orange: 'var(--color-orange)',
    yellow: 'var(--color-yellow)',
    green: 'var(--color-green)',
    blue: 'var(--color-blue)',
    purple: 'var(--color-purple)',
    pink: 'var(--color-pink)',
    brown: 'var(--color-brown)',
    black: 'var(--color-black)',
    white: 'var(--color-white)',
  }
  return map[color] ?? color
}
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
    <div v-if="!done" class="cw">
      <p class="cw__prompt">{{ promptText[locale] }}</p>

      <motion.div
        :key="stepIndex"
        class="cw__shape"
        :style="{ background: shapeFill(current?.color ?? 'red') }"
        :initial="{ scale: 0.7, opacity: 0 }"
        :animate="{ scale: 1, opacity: 1 }"
        :transition="{ duration: 0.4 }"
        :class="`is-${current?.shape ?? 'circle'}`"
        :aria-label="`A ${current?.shape ?? 'circle'} colored ${current?.color}`"
      />

      <div class="cw__voice">
        <MicButton
          :listening="voice.isListening.value"
          :supported="voice.isSupported.value"
          @press="onListenPress"
        />
        <p class="cw__voice-label">
          {{ voice.isListening.value ? '...' : tapToTalk }}
        </p>
        <p v-if="voice.transcript.value" class="cw__transcript">
          "{{ voice.transcript.value }}"
        </p>
      </div>

      <div class="cw__sep">{{ orTap }}</div>

      <ul class="cw__choices">
        <li v-for="c in choiceColors" :key="c">
          <button
            type="button"
            class="cw__choice"
            :style="{ background: shapeFill(c) }"
            :aria-label="labelFor(c, locale)"
            @click="onTouchAnswer(c)"
          >
            <span>{{ labelFor(c, locale) }}</span>
          </button>
        </li>
      </ul>
    </div>

    <div v-else class="cw__done">
      <motion.div
        class="cw__done-emoji"
        :animate="{ rotate: [0, -8, 8, -8, 0] }"
        :transition="{ duration: 1, repeat: Infinity, repeatDelay: 0.8 }"
      >
        🎉
      </motion.div>
      <h2>{{ completeMsg }}</h2>
      <NuxtLink to="/" class="cw__home-btn">
        {{ locale === 'id' ? 'Kembali' : 'Back home' }}
      </NuxtLink>
    </div>
  </WorksheetShell>
</template>

<style scoped>
.cw {
  display: grid;
  gap: 1.5rem;
  justify-items: center;
  width: 100%;
  max-width: 720px;
}
.cw__prompt {
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 2.5vw, 1.75rem);
  font-weight: 600;
  margin: 0;
  text-align: center;
}
.cw__shape {
  width: clamp(180px, 30vw, 240px);
  aspect-ratio: 1;
  box-shadow: var(--shadow-card);
}
.cw__shape.is-circle { border-radius: 50%; }
.cw__shape.is-square { border-radius: 24px; }
.cw__shape.is-triangle {
  background: transparent !important;
  width: 0; height: 0;
  border-left: 120px solid transparent;
  border-right: 120px solid transparent;
}
.cw__shape.is-star {
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}
.cw__shape.is-heart {
  clip-path: path('M50,80 C0,50 0,15 25,15 C40,15 50,30 50,30 C50,30 60,15 75,15 C100,15 100,50 50,80 Z');
}

.cw__voice {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
}
.cw__voice-label {
  font-family: var(--font-display);
  font-weight: 600;
  margin: 0;
}
.cw__transcript {
  margin: 0;
  color: var(--color-fg-muted);
  font-style: italic;
}
.cw__sep {
  color: var(--color-fg-muted);
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.cw__choices {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  width: 100%;
}
.cw__choice {
  width: 100%;
  height: 64px;
  border: 0;
  border-radius: var(--radius-md);
  color: var(--color-white);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.05em;
  text-transform: capitalize;
  box-shadow: var(--shadow-card);
  transition: transform 0.15s;
}
.cw__choice:active {
  transform: scale(0.96);
}

.cw__done {
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 1.5rem;
}
.cw__done-emoji {
  font-size: 4rem;
}
.cw__home-btn {
  padding: 0.85rem 1.75rem;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-white);
  font-family: var(--font-display);
  font-weight: 600;
}
</style>
