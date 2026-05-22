<script setup lang="ts">
import { motion } from 'motion-v'
import type { Locale, LocalizedString, PhraseDictionary, WorksheetMeta } from '~/types/worksheet'

interface DanceMove {
  id: string
  emoji: string
  name: { en: string, id: string }
}

interface LoopPrompt {
  // Target sequence is `pattern` repeated `times` times.
  pattern: string[] // move ids
  times: number
}

interface LoopData {
  moves: DanceMove[]
  prompts: LoopPrompt[]
}

const props = defineProps<{
  worksheet: WorksheetMeta
}>()

const data = computed(() => props.worksheet.data as unknown as LoopData)
const moves = computed(() => data.value?.moves ?? [])
const prompts = computed(() => data.value?.prompts ?? [])

const locale = useLocale()
const voice = useVoice()

const stepIndex = ref(0)
const feedback = ref<'idle' | 'correct' | 'wrong'>('idle')
const showHint = ref(false)

const current = computed(() => prompts.value[stepIndex.value])
const done = computed(() => stepIndex.value >= prompts.value.length)

// User's working values
const blocks = ref<string[]>([]) // ordered move ids in the loop body
const repeatCount = ref(2)
const isPlaying = ref(false)
const playingIndex = ref(-1)
const playingTotal = computed(() => blocks.value.length * repeatCount.value)

// Number words for voice repeat-count entry, EN + ID, 1..10
const numberPhrases: PhraseDictionary = {
  '1': { en: ['one', '1'], id: ['satu', '1'] },
  '2': { en: ['two', '2'], id: ['dua', '2'] },
  '3': { en: ['three', '3'], id: ['tiga', '3'] },
  '4': { en: ['four', '4'], id: ['empat', '4'] },
  '5': { en: ['five', '5'], id: ['lima', '5'] },
  '6': { en: ['six', '6'], id: ['enam', '6'] },
  '7': { en: ['seven', '7'], id: ['tujuh', '7'] },
  '8': { en: ['eight', '8'], id: ['delapan', '8'] },
  '9': { en: ['nine', '9'], id: ['sembilan', '9'] },
  '10': { en: ['ten', '10'], id: ['sepuluh', '10'] },
}

const movePhrases = computed<PhraseDictionary>(() => {
  const dict: PhraseDictionary = {}
  for (const m of moves.value) {
    dict[m.id] = { en: [m.name.en], id: [m.name.id] }
  }
  return dict
})

const allPhrases = computed<PhraseDictionary>(() => ({
  ...numberPhrases,
  ...movePhrases.value,
  run: { en: ['go', 'run', 'play', 'start'], id: ['jalan', 'mulai', 'main'] },
  reset: { en: ['reset', 'clear'], id: ['ulang', 'hapus'] },
}))

const promptCopy = computed<LocalizedString>(() => ({
  en: 'Build the loop. Add moves, set repeats, then say "go".',
  id: 'Bangun loop-nya. Tambah gerakan, atur jumlah ulang, lalu sebutkan "jalan".',
}))

const hint = computed<LocalizedString>(() => {
  if (!current.value) return { en: '', id: '' }
  const targetLen = current.value.pattern.length
  return {
    en: `The pattern is ${targetLen} move${targetLen === 1 ? '' : 's'} repeated ${current.value.times} times.`,
    id: `Polanya ${targetLen} gerakan diulang ${current.value.times} kali.`,
  }
})

const tapToTalk = computed(() => (locale.value === 'id' ? 'Tekan dan bicara' : 'Tap to speak'))
const goLabel = computed(() => (locale.value === 'id' ? 'Jalan' : 'Go'))
const resetLabel = computed(() => (locale.value === 'id' ? 'Ulang' : 'Reset'))
const repeatLabel = computed(() => (locale.value === 'id' ? 'Ulang sebanyak' : 'Repeat'))
const completeMsg = computed(() => (locale.value === 'id'
  ? 'Loop sempurna!'
  : 'Loop nailed it!'))

watch(current, () => {
  blocks.value = []
  repeatCount.value = 2
  isPlaying.value = false
  playingIndex.value = -1
  voice.reset()
  showHint.value = false
}, { immediate: true })

function addMove(id: string) {
  if (isPlaying.value) return
  blocks.value.push(id)
}

function clearAll() {
  if (isPlaying.value) return
  blocks.value = []
}

function setRepeat(n: number) {
  if (isPlaying.value) return
  repeatCount.value = Math.max(1, Math.min(10, n))
}

async function play() {
  if (isPlaying.value || !current.value) return
  if (blocks.value.length === 0) return
  isPlaying.value = true
  playingIndex.value = -1

  for (let r = 0; r < repeatCount.value; r++) {
    for (let i = 0; i < blocks.value.length; i++) {
      playingIndex.value = r * blocks.value.length + i
      await new Promise(res => setTimeout(res, 380))
    }
  }

  // Compare expected vs played
  const target: string[] = []
  for (let r = 0; r < current.value.times; r++) target.push(...current.value.pattern)
  const result: string[] = []
  for (let r = 0; r < repeatCount.value; r++) result.push(...blocks.value)

  const ok = target.length === result.length && target.every((m, i) => m === result[i])

  if (ok) {
    feedback.value = 'correct'
    setTimeout(() => {
      feedback.value = 'idle'
      stepIndex.value += 1
    }, 1100)
  }
  else {
    feedback.value = 'wrong'
    setTimeout(() => { feedback.value = 'idle' }, 900)
  }

  isPlaying.value = false
  playingIndex.value = -1
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
  const result = voice.evaluate(allPhrases.value)
  if (!result.matched) return
  if (result.matched === 'run') play()
  else if (result.matched === 'reset') clearAll()
  else if (/^\d+$/.test(result.matched)) setRepeat(Number.parseInt(result.matched, 10))
  else if (moves.value.some(m => m.id === result.matched)) addMove(result.matched)
})

const moveById = computed(() => {
  const map = new Map<string, DanceMove>()
  for (const m of moves.value) map.set(m.id, m)
  return map
})

// Flatten the visible "expanded" sequence so kids see what the loop will do.
const expanded = computed<string[]>(() => {
  const out: string[] = []
  for (let r = 0; r < repeatCount.value; r++) out.push(...blocks.value)
  return out
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
    <div v-if="!done && current" class="lp">
      <p class="lp__prompt">{{ promptCopy[locale] }}</p>

      <!-- The "loop body" composer -->
      <div class="lp__loop">
        <div class="lp__loop-head">
          <span class="lp__loop-keyword">repeat</span>
          <div class="lp__counter">
            <button
              class="lp__counter-btn"
              :disabled="isPlaying"
              :aria-label="locale === 'id' ? 'Kurang' : 'Decrease'"
              @click="setRepeat(repeatCount - 1)"
            >
              −
            </button>
            <span class="lp__counter-num">{{ repeatCount }}</span>
            <button
              class="lp__counter-btn"
              :disabled="isPlaying"
              :aria-label="locale === 'id' ? 'Tambah' : 'Increase'"
              @click="setRepeat(repeatCount + 1)"
            >
              +
            </button>
          </div>
          <span class="lp__loop-keyword">×</span>
        </div>
        <div class="lp__loop-body" :aria-label="repeatLabel">
          <span v-if="blocks.length === 0" class="lp__loop-empty">
            {{ locale === 'id' ? 'Pilih gerakan di bawah' : 'Add moves below' }}
          </span>
          <motion.span
            v-for="(id, i) in blocks"
            :key="`b-${i}`"
            class="lp__block"
            :initial="{ scale: 0.7, opacity: 0 }"
            :animate="{ scale: 1, opacity: 1 }"
            :transition="{ duration: 0.2 }"
          >
            <span class="lp__block-emoji">{{ moveById.get(id)?.emoji }}</span>
            <span class="lp__block-name">{{ moveById.get(id)?.name[locale] }}</span>
          </motion.span>
        </div>
      </div>

      <!-- Expanded preview -->
      <div class="lp__expanded" :aria-label="locale === 'id' ? 'Pratinjau' : 'Preview'">
        <span class="lp__expanded-label">
          {{ locale === 'id' ? 'Akan menjadi' : 'Becomes' }}: ({{ expanded.length }}
          {{ locale === 'id' ? 'gerakan' : 'moves' }})
        </span>
        <div class="lp__expanded-row">
          <span
            v-for="(id, i) in expanded"
            :key="`e-${i}`"
            class="lp__expanded-chip"
            :class="{ 'is-active': i === playingIndex }"
          >
            {{ moveById.get(id)?.emoji }}
          </span>
        </div>
      </div>

      <!-- Move palette -->
      <ul class="lp__moves">
        <li v-for="m in moves" :key="m.id">
          <button
            type="button"
            class="lp__move"
            :disabled="isPlaying"
            @click="addMove(m.id)"
          >
            <span class="lp__move-emoji">{{ m.emoji }}</span>
            <span class="lp__move-name">{{ m.name[locale] }}</span>
          </button>
        </li>
      </ul>

      <div class="lp__actions">
        <button
          class="lp__go"
          :disabled="isPlaying || blocks.length === 0"
          @click="play"
        >
          ▶ {{ goLabel }}
        </button>
        <button
          class="lp__reset"
          :disabled="isPlaying || blocks.length === 0"
          @click="clearAll"
        >
          {{ resetLabel }}
        </button>

        <div class="lp__voice">
          <MicButton
            size="md"
            :listening="voice.isListening.value"
            :supported="voice.isSupported.value"
            @press="onListenPress"
          />
          <p class="lp__voice-label">
            {{ voice.isListening.value ? '...' : tapToTalk }}
          </p>
        </div>
      </div>
      <p v-if="voice.transcript.value" class="lp__transcript">
        "{{ voice.transcript.value }}"
      </p>
    </div>

    <div v-else class="lp__done">
      <motion.div
        class="lp__done-emoji"
        :animate="{ rotate: [0, 12, -12, 12, 0] }"
        :transition="{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }"
      >
        💃
      </motion.div>
      <h2>{{ completeMsg }}</h2>
      <NuxtLink to="/" class="lp__home-btn">
        {{ locale === 'id' ? 'Kembali' : 'Back home' }}
      </NuxtLink>
    </div>
  </WorksheetShell>
</template>

<style scoped>
.lp {
  width: 100%;
  max-width: 880px;
  display: grid;
  gap: 1.25rem;
}
.lp__prompt {
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  font-weight: 600;
  margin: 0;
  text-align: center;
}

.lp__loop {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  box-shadow: var(--shadow-card);
  border-left: 6px solid var(--color-purple);
}
.lp__loop-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.lp__loop-keyword {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-purple);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.lp__counter {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-bg);
  border-radius: 999px;
  padding: 4px;
}
.lp__counter-btn {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  background: var(--color-surface);
  font-size: 1.25rem;
  font-weight: 700;
}
.lp__counter-btn:disabled {
  opacity: 0.4;
}
.lp__counter-num {
  min-width: 28px;
  text-align: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.4rem;
}
.lp__loop-body {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 56px;
  align-items: center;
}
.lp__loop-empty {
  color: var(--color-fg-muted);
  font-style: italic;
}
.lp__block {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  background: var(--color-accent-soft);
  font-family: var(--font-display);
  font-weight: 600;
}
.lp__block-emoji {
  font-size: 1.4rem;
}

.lp__expanded {
  background: var(--color-bg-deep);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
}
.lp__expanded-label {
  display: block;
  font-size: 0.85rem;
  color: var(--color-fg-muted);
  margin-bottom: 0.5rem;
  letter-spacing: 0.05em;
}
.lp__expanded-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.lp__expanded-chip {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-surface);
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  transition: transform 0.15s, background 0.15s;
}
.lp__expanded-chip.is-active {
  transform: scale(1.25);
  background: var(--color-success);
}

.lp__moves {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: center;
}
.lp__move {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 64px;
  padding: 0 1rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  font-family: var(--font-display);
  font-weight: 600;
}
.lp__move:disabled {
  opacity: 0.4;
}
.lp__move-emoji {
  font-size: 1.6rem;
}

.lp__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
}
.lp__go,
.lp__reset {
  height: 64px;
  padding: 0 1.5rem;
  border: 0;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.05rem;
  min-width: 140px;
}
.lp__go {
  background: var(--color-success);
  color: var(--color-white);
}
.lp__reset {
  background: var(--color-bg-deep);
  color: var(--color-fg);
}
.lp__go:disabled,
.lp__reset:disabled {
  opacity: 0.4;
}

.lp__voice {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}
.lp__voice-label {
  font-family: var(--font-display);
  font-weight: 600;
  margin: 0;
  font-size: 0.9rem;
}
.lp__transcript {
  margin: 0;
  text-align: center;
  color: var(--color-fg-muted);
  font-style: italic;
  text-transform: capitalize;
}

.lp__done {
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 1.5rem;
}
.lp__done-emoji {
  font-size: 4rem;
}
.lp__home-btn {
  padding: 0.85rem 1.75rem;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-white);
  font-family: var(--font-display);
  font-weight: 600;
}
</style>
