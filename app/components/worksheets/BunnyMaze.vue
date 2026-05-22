<script setup lang="ts">
import { motion } from 'motion-v'
import type { Locale, LocalizedString, PhraseDictionary, WorksheetMeta } from '~/types/worksheet'

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

const current = computed(() => levels.value[stepIndex.value])
const done = computed(() => stepIndex.value >= levels.value.length)

// User's plan: ordered list of moves before execution.
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
  en: 'Plan the bunny\'s path. Then say "go".',
  id: 'Susun rencana jalan kelinci. Lalu sebutkan "jalan".',
}))

const hint = computed<LocalizedString>(() => ({
  en: 'Add steps with voice ("up", "right") or arrows. Say "go" to run.',
  id: 'Tambahkan langkah pakai suara ("atas", "kanan") atau panah. Sebut "jalan" untuk menjalankan.',
}))

const tapToTalk = computed(() => (locale.value === 'id' ? 'Tekan dan bicara' : 'Tap to speak'))
const goLabel = computed(() => (locale.value === 'id' ? 'Jalan' : 'Go'))
const resetLabel = computed(() => (locale.value === 'id' ? 'Ulang' : 'Reset'))
const completeMsg = computed(() => (locale.value === 'id'
  ? 'Maze terpecahkan!'
  : 'Maze cleared!'))

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
  voice.reset()
  showHint.value = false
}, { immediate: true })

function addStep(d: Dir) {
  if (isRunning.value) return
  plan.value.push(d)
}

function clearPlan() {
  if (isRunning.value || !current.value) return
  plan.value = []
  bunny.value = [...current.value.start] as [number, number]
}

async function runPlan() {
  if (isRunning.value || !current.value) return
  isRunning.value = true
  bunny.value = [...current.value.start] as [number, number]
  await new Promise(r => setTimeout(r, 200))

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
      feedback.value = 'wrong'
      isRunning.value = false
      setTimeout(() => { feedback.value = 'idle' }, 800)
      return
    }
    bunny.value = [nx, ny]
    await new Promise(r => setTimeout(r, 380))
  }

  const [bx, by] = bunny.value
  const [gx, gy] = current.value.goal
  if (bx === gx && by === gy) {
    feedback.value = 'correct'
    setTimeout(() => {
      feedback.value = 'idle'
      stepIndex.value += 1
    }, 1000)
  }
  else {
    feedback.value = 'wrong'
    setTimeout(() => { feedback.value = 'idle' }, 800)
  }
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

const cellStyle = computed(() => current.value
  ? {
    gridTemplateColumns: `repeat(${current.value.cols}, 1fr)`,
    gridTemplateRows: `repeat(${current.value.rows}, 1fr)`,
  }
  : {})

function isStart(x: number, y: number): boolean {
  return current.value ? current.value.start[0] === x && current.value.start[1] === y : false
}
function isGoal(x: number, y: number): boolean {
  return current.value ? current.value.goal[0] === x && current.value.goal[1] === y : false
}
function isWall(x: number, y: number): boolean {
  return wallSet.value.has(`${x},${y}`)
}
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
        <div class="mz__board" :style="cellStyle">
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
              <span v-if="isGoal(x - 1, y - 1) && !isStart(x - 1, y - 1)">🥕</span>
            </div>
          </template>
          <motion.div
            class="mz__bunny"
            :animate="{
              gridColumnStart: bunny[0] + 1,
              gridRowStart: bunny[1] + 1,
            }"
            :transition="{ type: 'spring', stiffness: 280, damping: 22 }"
          >
            🐰
          </motion.div>
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
              <span
                v-for="(d, i) in plan"
                :key="`p-${i}`"
                class="mz__plan-step"
              >
                {{ dirEmoji[d] }}
              </span>
            </div>
          </div>

          <div class="mz__pad">
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
  font-size: clamp(1.1rem, 2vw, 1.5rem);
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
@media (max-width: 720px) {
  .mz__layout {
    grid-template-columns: 1fr;
  }
}

.mz__board {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  display: grid;
  gap: 4px;
  background: var(--color-bg-deep);
  border-radius: var(--radius-md);
  padding: 0.75rem;
}
.mz__tile {
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  font-size: 1.5rem;
}
.mz__tile.is-wall {
  background: var(--color-fg);
}
.mz__tile.is-start {
  background: var(--color-accent-soft);
}
.mz__tile.is-goal {
  background: rgba(6, 214, 160, 0.18);
  border: 2px dashed var(--color-success);
}
.mz__bunny {
  grid-area: 1 / 1;
  display: grid;
  place-items: center;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  pointer-events: none;
  z-index: 2;
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

.mz__pad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  width: 100%;
  max-width: 220px;
  justify-self: center;
}
.mz__arrow {
  height: 56px;
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
  height: 56px;
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
