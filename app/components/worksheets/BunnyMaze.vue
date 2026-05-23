<script setup lang="ts">
import { motion } from 'motion-v'
import type { LocalizedString, PhraseDictionary, WorksheetMeta } from '~/types/worksheet'

interface MazeLevel {
  cols: number
  rows: number
  start: [number, number]
  goal: [number, number]
  walls?: Array<[number, number]>
}

interface MazeData {
  levels: MazeLevel[]
}

type Dir = 'up' | 'down' | 'left' | 'right'

const props = defineProps<{
  worksheet: WorksheetMeta
}>()

const data = computed(() => props.worksheet.data as unknown as MazeData)
const levels = computed(() => data.value?.levels ?? [])

const locale = useLocale()
const voice = useVoice()

const stepIndex = ref(0)
const feedback = ref<'idle' | 'correct' | 'wrong'>('idle')
const showHint = ref(false)
const runStatus = ref<'idle' | 'running' | 'won' | 'crashed' | 'shortfall'>('idle')

const current = computed(() => levels.value[stepIndex.value])
const done = computed(() => stepIndex.value >= levels.value.length)

const plan = ref<Dir[]>([])
const isRunning = ref(false)
const bunny = ref<[number, number]>([0, 0])

const dirPhrases: PhraseDictionary = {
  up: { en: ['up', 'north'], id: ['atas', 'naik', 'utara'] },
  down: { en: ['down', 'south'], id: ['bawah', 'turun', 'selatan'] },
  left: { en: ['left', 'west'], id: ['kiri', 'barat'] },
  right: { en: ['right', 'east', 'forward'], id: ['kanan', 'maju', 'timur'] },
  run: { en: ['go', 'run', 'start', 'play'], id: ['jalan', 'mulai', 'main'] },
  reset: { en: ['reset', 'clear', 'undo'], id: ['ulang', 'hapus', 'reset'] },
}

const dirEmoji: Record<Dir, string> = {
  up: '↑', down: '↓', left: '←', right: '→',
}

const promptCopy = computed<LocalizedString>(() => ({
  en: 'Plan a path so the bunny touches the carrot. Then say "go".',
  id: 'Susun jalur agar kelinci menyentuh wortel. Lalu sebutkan "jalan".',
}))

const hint = computed<LocalizedString>(() => {
  if (runStatus.value === 'crashed') {
    return {
      en: 'The bunny hit a wall or went out of the grid. Tap reset and try again.',
      id: 'Kelinci kena dinding atau keluar dari kotak. Tekan ulang dan coba lagi.',
    }
  }
  if (runStatus.value === 'shortfall') {
    return {
      en: 'The plan finished but the bunny missed the carrot. Add more steps.',
      id: 'Rencana selesai tapi belum sampai wortel. Tambah langkah.',
    }
  }
  return {
    en: 'Add steps with voice ("up", "right") or arrows. Say "go" to run.',
    id: 'Tambah langkah pakai suara ("atas", "kanan") atau panah. Sebut "jalan" untuk menjalankan.',
  }
})

const tapToTalk = computed(() => (locale.value === 'id' ? 'Tekan dan bicara' : 'Tap to speak'))
const goLabel = computed(() => (locale.value === 'id' ? 'Jalan' : 'Go'))
const resetLabel = computed(() => (locale.value === 'id' ? 'Ulang' : 'Reset'))
const completeMsg = computed(() => (locale.value === 'id'
  ? 'Semua labirin terpecahkan!'
  : 'All mazes cleared!'))

const wallSet = computed(() => {
  const set = new Set<string>()
  for (const w of current.value?.walls ?? []) set.add(`${w[0]},${w[1]}`)
  return set
})

watch(current, (lvl) => {
  if (!lvl) return
  bunny.value = [...lvl.start] as [number, number]
  plan.value = []
  isRunning.value = false
  runStatus.value = 'idle'
  voice.reset()
  showHint.value = false
}, { immediate: true })

function addStep(d: Dir) {
  if (isRunning.value) return
  if (runStatus.value !== 'idle' && runStatus.value !== 'running') return
  plan.value.push(d)
}

function clearPlan() {
  if (isRunning.value || !current.value) return
  plan.value = []
  bunny.value = [...current.value.start] as [number, number]
  runStatus.value = 'idle'
}

async function runPlan() {
  if (isRunning.value || !current.value) return
  if (plan.value.length === 0) return
  isRunning.value = true
  runStatus.value = 'running'
  bunny.value = [...current.value.start] as [number, number]
  await new Promise(r => setTimeout(r, 250))

  const [gx, gy] = current.value.goal

  for (const move of plan.value) {
    const [x, y] = bunny.value
    let nx = x, ny = y
    if (move === 'up') ny -= 1
    else if (move === 'down') ny += 1
    else if (move === 'left') nx -= 1
    else if (move === 'right') nx += 1

    const inBounds = nx >= 0 && nx < current.value.cols && ny >= 0 && ny < current.value.rows
    const isWall = wallSet.value.has(`${nx},${ny}`)
    if (!inBounds || isWall) {
      // Crash: stop here, reveal failure clearly.
      runStatus.value = 'crashed'
      feedback.value = 'wrong'
      isRunning.value = false
      setTimeout(() => { feedback.value = 'idle' }, 900)
      return
    }
    bunny.value = [nx, ny]
    await new Promise(r => setTimeout(r, 420))

    // Win the moment the bunny touches the carrot. Kids find
    // "land exactly on the last step" too punishing for SD-low.
    if (nx === gx && ny === gy) {
      runStatus.value = 'won'
      feedback.value = 'correct'
      setTimeout(() => {
        feedback.value = 'idle'
        stepIndex.value += 1
      }, 1200)
      isRunning.value = false
      return
    }
  }

  // Plan ran out without reaching the goal.
  runStatus.value = 'shortfall'
  feedback.value = 'wrong'
  setTimeout(() => { feedback.value = 'idle' }, 900)
  isRunning.value = false
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
  const result = voice.evaluate(dirPhrases)
  if (!result.matched) return
  if (result.matched === 'run') runPlan()
  else if (result.matched === 'reset') clearPlan()
  else addStep(result.matched as Dir)
})

function isStart(x: number, y: number): boolean {
  return current.value ? current.value.start[0] === x && current.value.start[1] === y : false
}
function isGoal(x: number, y: number): boolean {
  return current.value ? current.value.goal[0] === x && current.value.goal[1] === y : false
}
function isWall(x: number, y: number): boolean {
  return wallSet.value.has(`${x},${y}`)
}

const boardStyle = computed(() => current.value
  ? {
    '--cols': current.value.cols,
    '--rows': current.value.rows,
    '--bx': bunny.value[0],
    '--by': bunny.value[1],
    gridTemplateColumns: `repeat(${current.value.cols}, 1fr)`,
    gridTemplateRows: `repeat(${current.value.rows}, 1fr)`,
  } as Record<string, string | number>
  : {})
</script>

<template>
  <WorksheetShell
    :title="worksheet.title"
    :type="worksheet.type"
    :steps="levels.length"
    :current="stepIndex"
    :feedback="feedback"
    :hint="showHint ? hint : null"
    @hint="showHint = !showHint"
  >
    <div v-if="!done && current" class="mz">
      <p class="mz__prompt">{{ promptCopy[locale] }}</p>

      <div class="mz__layout">
        <div class="mz__board" :style="boardStyle">
          <template v-for="y in current.rows" :key="`row-${y}`">
            <div
              v-for="x in current.cols"
              :key="`c-${x}-${y}`"
              class="mz__tile"
              :class="{
                'is-wall': isWall(x - 1, y - 1),
                'is-start': isStart(x - 1, y - 1),
                'is-goal': isGoal(x - 1, y - 1),
              }"
            >
              <span v-if="isGoal(x - 1, y - 1)" class="mz__goal">🥕</span>
              <span v-else-if="isStart(x - 1, y - 1)" class="mz__home">🏠</span>
              <span v-else-if="isWall(x - 1, y - 1)" class="mz__wall" aria-hidden="true">▮</span>
            </div>
          </template>
          <span class="mz__bunny" aria-label="bunny">🐰</span>
        </div>

        <div class="mz__panel">
          <div class="mz__plan-box" :aria-label="locale === 'id' ? 'Daftar langkah' : 'Plan'">
            <p class="mz__plan-title">
              {{ locale === 'id' ? 'Rencana' : 'Plan' }}
              <span class="mz__plan-count">({{ plan.length }})</span>
            </p>
            <div class="mz__plan-list">
              <span v-if="plan.length === 0" class="mz__plan-empty">
                {{ locale === 'id' ? 'Belum ada langkah' : 'No steps yet' }}
              </span>
              <motion.span
                v-for="(d, i) in plan"
                :key="`p-${i}`"
                class="mz__plan-step"
                :initial="{ scale: 0.6, opacity: 0 }"
                :animate="{ scale: 1, opacity: 1 }"
                :transition="{ duration: 0.18 }"
              >
                {{ dirEmoji[d] }}
              </motion.span>
            </div>
            <p
              v-if="runStatus === 'crashed' || runStatus === 'shortfall'"
              class="mz__status is-bad"
            >
              {{ runStatus === 'crashed'
                ? (locale === 'id' ? 'Kena dinding!' : 'Hit a wall!')
                : (locale === 'id' ? 'Belum sampai wortel' : 'Did not reach the carrot') }}
            </p>
          </div>

          <div class="mz__pad" :aria-label="locale === 'id' ? 'Tombol arah' : 'Direction pad'">
            <span></span>
            <button class="mz__arrow" :disabled="isRunning" @click="addStep('up')">↑</button>
            <span></span>
            <button class="mz__arrow" :disabled="isRunning" @click="addStep('left')">←</button>
            <button class="mz__arrow is-secondary" :disabled="isRunning" @click="clearPlan">⟲</button>
            <button class="mz__arrow" :disabled="isRunning" @click="addStep('right')">→</button>
            <span></span>
            <button class="mz__arrow" :disabled="isRunning" @click="addStep('down')">↓</button>
            <span></span>
          </div>

          <div class="mz__actions">
            <button
              type="button"
              class="mz__go"
              :disabled="isRunning || plan.length === 0"
              @click="runPlan"
            >
              ▶ {{ goLabel }}
            </button>
            <button
              type="button"
              class="mz__clear"
              :disabled="isRunning || plan.length === 0"
              @click="clearPlan"
            >
              {{ resetLabel }}
            </button>
          </div>

          <div class="mz__voice">
            <MicButton
              size="md"
              :listening="voice.isListening.value"
              :supported="voice.isSupported.value"
              @press="onListenPress"
            />
            <p class="mz__voice-label">
              {{ voice.isListening.value ? '...' : tapToTalk }}
            </p>
            <p v-if="voice.transcript.value" class="mz__transcript">
              "{{ voice.transcript.value }}"
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="mz__done">
      <motion.div
        class="mz__done-emoji"
        :animate="{ rotate: [0, 8, -8, 8, 0] }"
        :transition="{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }"
      >
        🏆
      </motion.div>
      <h2>{{ completeMsg }}</h2>
      <NuxtLink to="/" class="mz__home-btn">
        {{ locale === 'id' ? 'Kembali' : 'Back home' }}
      </NuxtLink>
    </div>
  </WorksheetShell>
</template>

<style scoped>
.mz {
  width: 100%;
  max-width: 1100px;
  display: grid;
  gap: 1.25rem;
}
.mz__prompt {
  font-family: var(--font-display);
  font-size: clamp(1rem, 2vw, 1.4rem);
  font-weight: 600;
  margin: 0;
  text-align: center;
}

.mz__layout {
  display: grid;
  grid-template-columns: minmax(280px, 1.5fr) minmax(260px, 1fr);
  gap: 1.5rem;
  align-items: start;
}
@media (max-width: 820px) {
  .mz__layout {
    grid-template-columns: 1fr;
  }
}

.mz__board {
  /* CSS variables drive cell-perfect bunny positioning regardless of
     how many cols/rows a level has. */
  --pad: clamp(0.5rem, 1.5vw, 0.75rem);
  --gap: clamp(3px, 0.6vw, 5px);
  --cell-w: calc((100% - var(--pad) * 2 - var(--gap) * (var(--cols) - 1)) / var(--cols));
  --cell-h: calc((100% - var(--pad) * 2 - var(--gap) * (var(--rows) - 1)) / var(--rows));

  position: relative;
  width: 100%;
  aspect-ratio: 1;
  display: grid;
  gap: var(--gap);
  background: var(--color-bg-deep);
  border-radius: var(--radius-md);
  padding: var(--pad);
}
.mz__tile {
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  font-size: clamp(0.9rem, 2.5vw, 1.5rem);
}
.mz__tile.is-wall {
  background: #2a2f4a;
  color: rgba(255, 255, 255, 0.15);
}
.mz__tile.is-start {
  background: var(--color-accent-soft);
}
.mz__tile.is-goal {
  background: rgba(6, 214, 160, 0.18);
  border: 2px dashed var(--color-success);
}
.mz__goal,
.mz__home {
  font-size: 1.25em;
}
.mz__wall {
  font-size: 0.7em;
}

.mz__bunny {
  position: absolute;
  width: var(--cell-w);
  height: var(--cell-h);
  left: calc(var(--pad) + var(--bx) * (var(--cell-w) + var(--gap)));
  top: calc(var(--pad) + var(--by) * (var(--cell-h) + var(--gap)));
  display: grid;
  place-items: center;
  font-size: clamp(1.4rem, 4vw, 2.25rem);
  pointer-events: none;
  z-index: 2;
  transition:
    left 0.36s cubic-bezier(0.4, 0, 0.2, 1),
    top 0.36s cubic-bezier(0.4, 0, 0.2, 1);
}

.mz__panel {
  display: grid;
  gap: 1rem;
}
.mz__plan-box {
  background: var(--color-surface);
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}
.mz__plan-title {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-weight: 600;
  margin: 0 0 0.5rem;
}
.mz__plan-count {
  color: var(--color-fg-muted);
  font-size: 0.85rem;
  font-weight: 500;
}
.mz__plan-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  min-height: 2.25rem;
}
.mz__plan-step {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--color-accent-soft);
  font-weight: 700;
}
.mz__plan-empty {
  color: var(--color-fg-muted);
  font-style: italic;
  font-size: 0.9rem;
}
.mz__status {
  margin: 0.5rem 0 0;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.9rem;
}
.mz__status.is-bad {
  color: var(--color-error);
}

.mz__pad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  width: 100%;
  max-width: 240px;
  justify-self: center;
}
.mz__arrow {
  height: clamp(48px, 12vw, 56px);
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: 1.5rem;
  font-weight: 700;
  box-shadow: var(--shadow-card);
}
.mz__arrow.is-secondary {
  background: var(--color-bg-deep);
  font-size: 1.25rem;
}
.mz__arrow:disabled {
  opacity: 0.4;
}

.mz__actions {
  display: flex;
  gap: 0.5rem;
}
.mz__go,
.mz__clear {
  flex: 1;
  height: clamp(48px, 12vw, 56px);
  border: 0;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
}
.mz__go {
  background: var(--color-success);
  color: var(--color-white);
}
.mz__clear {
  background: var(--color-bg-deep);
  color: var(--color-fg);
}
.mz__go:disabled,
.mz__clear:disabled {
  opacity: 0.4;
}

.mz__voice {
  display: grid;
  justify-items: center;
  gap: 0.4rem;
  padding-top: 0.5rem;
  border-top: 1px dashed rgba(31, 37, 64, 0.1);
}
.mz__voice-label {
  font-family: var(--font-display);
  font-weight: 600;
  margin: 0;
  font-size: 0.85rem;
}
.mz__transcript {
  margin: 0;
  color: var(--color-fg-muted);
  font-style: italic;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.mz__done {
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 1.5rem;
}
.mz__done-emoji {
  font-size: 4rem;
}
.mz__home-btn {
  padding: 0.85rem 1.75rem;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-white);
  font-family: var(--font-display);
  font-weight: 600;
}
</style>
