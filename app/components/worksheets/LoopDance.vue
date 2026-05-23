<script setup lang="ts">
import { motion } from 'motion-v'
import type { LocalizedString, PhraseDictionary, WorksheetMeta } from '~/types/worksheet'

interface DanceMove {
  id: string
  emoji: string
  name: { en: string, id: string }
}

interface LoopPrompt {
  /** Move ids inside the loop body, in order. */
  pattern: string[]
  /** Number of times the body repeats. */
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
const targetPlayedOnce = ref(false)
const isShowingTarget = ref(false)
const targetIndex = ref(-1)

const current = computed(() => prompts.value[stepIndex.value])
const done = computed(() => stepIndex.value >= prompts.value.length)

// User's working values
const blocks = ref<string[]>([])
const repeatCount = ref(2)
const isPlaying = ref(false)
const playingIndex = ref(-1)

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
  show: { en: ['show', 'demo', 'watch'], id: ['lihat', 'tonton', 'demo'] },
}))

const promptCopy = computed<LocalizedString>(() => ({
  en: 'Watch the dance, then build a loop that matches it.',
  id: 'Tonton tarian, lalu bangun loop yang sama persis.',
}))

const goalLine = computed<LocalizedString>(() => {
  if (!current.value) return { en: '', id: '' }
  const len = current.value.pattern.length
  return {
    en: `The dance is ${len} move${len === 1 ? '' : 's'}, repeated ${current.value.times} times.`,
    id: `Tariannya ${len} gerakan, diulang ${current.value.times} kali.`,
  }
})

const hint = computed<LocalizedString>(() => {
  if (!current.value) return { en: '', id: '' }
  const moveNames = current.value.pattern
    .map(id => moves.value.find(m => m.id === id))
    .filter(Boolean) as DanceMove[]
  return {
    en: `Add ${moveNames.map(m => m.name.en).join(' + ')} to the loop body, then set repeat to ${current.value.times}.`,
    id: `Tambahkan ${moveNames.map(m => m.name.id).join(' + ')} ke loop, lalu atur ulang ke ${current.value.times}.`,
  }
})

const tapToTalk = computed(() => (locale.value === 'id' ? 'Tekan dan bicara' : 'Tap to speak'))
const goLabel = computed(() => (locale.value === 'id' ? 'Jalan' : 'Go'))
const resetLabel = computed(() => (locale.value === 'id' ? 'Ulang' : 'Reset'))
const watchLabel = computed(() => (locale.value === 'id' ? 'Tonton tarian' : 'Watch the dance'))
const completeMsg = computed(() => (locale.value === 'id' ? 'Loop sempurna!' : 'Loop nailed it!'))

const moveById = computed(() => {
  const map = new Map<string, DanceMove>()
  for (const m of moves.value) map.set(m.id, m)
  return map
})

// Full target sequence the kid is trying to reproduce.
const targetExpanded = computed<string[]>(() => {
  if (!current.value) return []
  const out: string[] = []
  for (let r = 0; r < current.value.times; r++) out.push(...current.value.pattern)
  return out
})

// What the kid's loop currently expands to.
const yourExpanded = computed<string[]>(() => {
  const out: string[] = []
  for (let r = 0; r < repeatCount.value; r++) out.push(...blocks.value)
  return out
})

watch(current, () => {
  blocks.value = []
  repeatCount.value = 1
  isPlaying.value = false
  playingIndex.value = -1
  targetIndex.value = -1
  isShowingTarget.value = false
  targetPlayedOnce.value = false
  voice.reset()
  showHint.value = false
}, { immediate: true })

// Auto-play the target once when a new prompt loads, so kids see the goal.
onMounted(() => { showTarget() })

async function showTarget() {
  if (!current.value || isPlaying.value || isShowingTarget.value) return
  isShowingTarget.value = true
  targetIndex.value = -1
  await new Promise(res => setTimeout(res, 250))
  for (let i = 0; i < targetExpanded.value.length; i++) {
    targetIndex.value = i
    await new Promise(res => setTimeout(res, 460))
  }
  await new Promise(res => setTimeout(res, 300))
  targetIndex.value = -1
  isShowingTarget.value = false
  targetPlayedOnce.value = true
}

function addMove(id: string) {
  if (isPlaying.value || isShowingTarget.value) return
  blocks.value.push(id)
}

function clearAll() {
  if (isPlaying.value || isShowingTarget.value) return
  blocks.value = []
}

function setRepeat(n: number) {
  if (isPlaying.value || isShowingTarget.value) return
  repeatCount.value = Math.max(1, Math.min(10, n))
}

async function play() {
  if (isPlaying.value || isShowingTarget.value || !current.value) return
  if (blocks.value.length === 0) return
  isPlaying.value = true
  playingIndex.value = -1

  for (let i = 0; i < yourExpanded.value.length; i++) {
    playingIndex.value = i
    await new Promise(res => setTimeout(res, 420))
  }

  const ok = targetExpanded.value.length === yourExpanded.value.length
    && targetExpanded.value.every((m, i) => m === yourExpanded.value[i])

  if (ok) {
    feedback.value = 'correct'
    setTimeout(() => {
      feedback.value = 'idle'
      stepIndex.value += 1
    }, 1200)
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
  else if (result.matched === 'show') showTarget()
  else if (/^\d+$/.test(result.matched)) setRepeat(Number.parseInt(result.matched, 10))
  else if (moves.value.some(m => m.id === result.matched)) addMove(result.matched)
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

      <!-- TARGET: the dance the kid needs to reproduce -->
      <section
        class="lp__target"
        :class="{ 'is-playing': isShowingTarget }"
        :aria-label="locale === 'id' ? 'Target tarian' : 'Target dance'"
      >
        <header class="lp__target-head">
          <span class="lp__target-label">
            🎯 {{ locale === 'id' ? 'Target' : 'Target' }}
          </span>
          <button
            type="button"
            class="lp__watch-btn"
            :disabled="isShowingTarget || isPlaying"
            @click="showTarget"
          >
            ▶ {{ watchLabel }}
          </button>
        </header>
        <p class="lp__target-line">{{ goalLine[locale] }}</p>
        <div class="lp__target-row">
          <span
            v-for="(id, i) in targetExpanded"
            :key="`t-${i}`"
            class="lp__target-chip"
            :class="{ 'is-active': i === targetIndex }"
          >
            {{ moveById.get(id)?.emoji }}
          </span>
        </div>
      </section>

      <!-- LOOP COMPOSER -->
      <div class="lp__loop">
        <div class="lp__loop-head">
          <span class="lp__loop-keyword">{{ locale === 'id' ? 'ulang' : 'repeat' }}</span>
          <div class="lp__counter">
            <button
              class="lp__counter-btn"
              :disabled="isPlaying || isShowingTarget"
              :aria-label="locale === 'id' ? 'Kurang' : 'Decrease'"
              @click="setRepeat(repeatCount - 1)"
            >
              −
            </button>
            <span class="lp__counter-num">{{ repeatCount }}</span>
            <button
              class="lp__counter-btn"
              :disabled="isPlaying || isShowingTarget"
              :aria-label="locale === 'id' ? 'Tambah' : 'Increase'"
              @click="setRepeat(repeatCount + 1)"
            >
              +
            </button>
          </div>
          <span class="lp__loop-keyword">×</span>
        </div>
        <div class="lp__loop-body">
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

      <!-- YOUR EXPANSION (so kid sees what the loop will play) -->
      <div class="lp__yours">
        <span class="lp__yours-label">
          {{ locale === 'id' ? 'Hasil loop kamu' : 'Your loop becomes' }}:
          <strong>{{ yourExpanded.length }}</strong>
          {{ locale === 'id' ? 'gerakan' : 'moves' }}
          <em>·</em>
          {{ locale === 'id' ? 'target' : 'target' }}
          <strong>{{ targetExpanded.length }}</strong>
        </span>
        <div class="lp__yours-row">
          <span v-if="yourExpanded.length === 0" class="lp__yours-empty">
            {{ locale === 'id' ? 'Belum ada gerakan' : 'Nothing yet' }}
          </span>
          <span
            v-for="(id, i) in yourExpanded"
            :key="`y-${i}`"
            class="lp__yours-chip"
            :class="{ 'is-active': i === playingIndex }"
          >
            {{ moveById.get(id)?.emoji }}
          </span>
        </div>
      </div>

      <!-- MOVE PALETTE -->
      <ul class="lp__moves">
        <li v-for="m in moves" :key="m.id">
          <button
            type="button"
            class="lp__move"
            :disabled="isPlaying || isShowingTarget"
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
          :disabled="isPlaying || isShowingTarget || blocks.length === 0"
          @click="play"
        >
          ▶ {{ goLabel }}
        </button>
        <button
          class="lp__reset"
          :disabled="isPlaying || isShowingTarget || blocks.length === 0"
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
  gap: 1.1rem;
}
.lp__prompt {
  font-family: var(--font-display);
  font-size: clamp(1rem, 2vw, 1.4rem);
  font-weight: 600;
  margin: 0;
  text-align: center;
}

.lp__target {
  background: linear-gradient(135deg, #fff5f9 0%, #fef0f4 100%);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  border: 2px solid var(--color-pink);
  display: grid;
  gap: 0.6rem;
}
.lp__target.is-playing {
  box-shadow: 0 0 0 4px rgba(255, 126, 182, 0.25);
}
.lp__target-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.lp__target-label {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.lp__watch-btn {
  height: 40px;
  padding: 0 1rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-pink);
  color: var(--color-white);
  font-family: var(--font-display);
  font-weight: 700;
}
.lp__watch-btn:disabled { opacity: 0.5; }
.lp__target-line {
  margin: 0;
  font-size: 0.95rem;
  color: var(--color-fg-muted);
}
.lp__target-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.lp__target-chip {
  width: clamp(36px, 8vw, 44px);
  height: clamp(36px, 8vw, 44px);
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--color-white);
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  transition: transform 0.18s, background 0.18s;
}
.lp__target-chip.is-active {
  transform: scale(1.3);
  background: var(--color-pink);
}

.lp__loop {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 0.9rem 1.1rem;
  box-shadow: var(--shadow-card);
  border-left: 6px solid var(--color-purple);
}
.lp__loop-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
  flex-wrap: wrap;
}
.lp__loop-keyword {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-purple);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.lp__counter {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
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
.lp__counter-btn:disabled { opacity: 0.4; }
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
  gap: 0.4rem;
  min-height: 48px;
  align-items: center;
}
.lp__loop-empty {
  color: var(--color-fg-muted);
  font-style: italic;
  font-size: 0.9rem;
}
.lp__block {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: var(--color-accent-soft);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.9rem;
}
.lp__block-emoji { font-size: 1.3rem; }

.lp__yours {
  background: var(--color-bg-deep);
  border-radius: var(--radius-md);
  padding: 0.7rem 1rem;
}
.lp__yours-label {
  display: block;
  font-size: 0.85rem;
  color: var(--color-fg-muted);
  margin-bottom: 0.4rem;
  letter-spacing: 0.04em;
}
.lp__yours-label em {
  color: var(--color-fg-muted);
  margin: 0 0.3rem;
}
.lp__yours-label strong {
  color: var(--color-fg);
  font-weight: 700;
}
.lp__yours-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.lp__yours-empty {
  color: var(--color-fg-muted);
  font-style: italic;
  font-size: 0.85rem;
}
.lp__yours-chip {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--color-surface);
  font-size: 1.1rem;
  transition: transform 0.15s, background 0.15s;
}
.lp__yours-chip.is-active {
  transform: scale(1.3);
  background: var(--color-success);
}

.lp__moves {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}
.lp__move {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: clamp(56px, 11vw, 64px);
  padding: 0 0.9rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.95rem;
}
.lp__move:disabled { opacity: 0.4; }
.lp__move-emoji { font-size: 1.4rem; }

.lp__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  justify-content: center;
}
.lp__go,
.lp__reset {
  height: clamp(56px, 11vw, 64px);
  padding: 0 1.25rem;
  border: 0;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  min-width: 120px;
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
.lp__reset:disabled { opacity: 0.4; }

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
.lp__done-emoji { font-size: 4rem; }
.lp__home-btn {
  padding: 0.85rem 1.75rem;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-white);
  font-family: var(--font-display);
  font-weight: 600;
}
</style>
