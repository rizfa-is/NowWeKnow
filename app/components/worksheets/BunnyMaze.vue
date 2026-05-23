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
const moveCount = ref(0)

const current = computed(() => levels.value[stepIndex.value])
const done = computed(() => stepIndex.value >= levels.value.length)

const bunny = ref<[number, number]>([0, 0])

const dirPhrases: PhraseDictionary = {
  up: { en: ['up', 'north'], id: ['atas', 'naik', 'utara'] },
  down: { en: ['down', 'south'], id: ['bawah', 'turun', 'selatan'] },
  left: { en: ['left', 'west'], id: ['kiri', 'barat'] },
  right: { en: ['right', 'east', 'forward'], id: ['kanan', 'maju', 'timur'] },
  reset: { en: ['reset', 'restart', 'back'], id: ['ulang', 'mulai', 'kembali'] },
}

const promptCopy = computed<LocalizedString>(() => ({
  en: 'Step the bunny to the carrot. Say "up", "down", "left", or "right".',
  id: 'Pindahkan kelinci ke wortel. Sebut "atas", "bawah", "kiri", atau "kanan".',
}))

const hint = computed<LocalizedString>(() => {
  if (!current.value) return { en: '', id: '' }
  const [bx, by] = bunny.value
  const [gx, gy] = current.value.goal
  const dx = gx - bx
  const dy = gy - by
  const parts: string[] = []
  const partsId: string[] = []
  if (dx > 0) { parts.push(`${dx} right`); partsId.push(`${dx} kanan`) }
  if (dx < 0) { parts.push(`${-dx} left`); partsId.push(`${-dx} kiri`) }
  if (dy > 0) { parts.push(`${dy} down`); partsId.push(`${dy} bawah`) }
  if (dy < 0) { parts.push(`${-dy} up`); partsId.push(`${-dy} atas`) }
  if (parts.length === 0) {
    return { en: 'Already there!', id: 'Sudah sampai!' }
  }
  return {
    en: `You need ${parts.join(' and ')}. Watch out for the dark walls.`,
    id: `Butuh ${partsId.join(' dan ')}. Hati-hati dinding gelap.`,
  }
})

const tapToTalk = computed(() => (locale.value === 'id' ? 'Tekan dan bicara' : 'Tap to speak'))
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
  moveCount.value = 0
  voice.reset()
  showHint.value = false
}, { immediate: true })

function reset() {
  if (!current.value) return
  bunny.value = [...current.value.start] as [number, number]
  moveCount.value = 0
}

function step(d: Dir) {
  if (!current.value) return
  if (feedback.value === 'correct') return

  const [x, y] = bunny.value
  let nx = x, ny = y
  if (d === 'up') ny -= 1
  else if (d === 'down') ny += 1
  else if (d === 'left') nx -= 1
  else if (d === 'right') nx += 1

  const inBounds = nx >= 0 && nx < current.value.cols && ny >= 0 && ny < current.value.rows
  const isWall = wallSet.value.has(`${nx},${ny}`)
  if (!inBounds || isWall) {
    // Bonk: don't move, give a brief "wrong" tick.
    feedback.value = 'wrong'
    setTimeout(() => { feedback.value = 'idle' }, 350)
    return
  }

  bunny.value = [nx, ny]
  moveCount.value += 1

  const [gx, gy] = current.value.goal
  if (nx === gx && ny === gy) {
    feedback.value = 'correct'
    setTimeout(() => {
      feedback.value = 'idle'
      stepIndex.value += 1
    }, 1100)
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
  const result = voice.evaluate(dirPhrases)
  if (!result.matched) return
  if (result.matched === 'reset') reset()
  else step(result.matched as Dir)
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
            </div>
          </template>
          <span class="mz__bunny" aria-label="bunny">🐰</span>
        </div>

        <div class="mz__panel">
          <div class="mz__counter" :aria-label="locale === 'id' ? 'Jumlah langkah' : 'Steps taken'">
            <span class="mz__counter-label">{{ locale === 'id' ? 'Langkah' : 'Steps' }}</span>
            <strong class="mz__counter-num">{{ moveCount }}</strong>
          </div>

          <div class="mz__pad" :aria-label="locale === 'id' ? 'Tombol arah' : 'Direction pad'">
            <span></span>
            <button class="mz__arrow" @click="step('up')">↑</button>
            <span></span>
            <button class="mz__arrow" @click="step('left')">←</button>
            <button class="mz__arrow is-secondary" :aria-label="resetLabel" @click="reset">⟲</button>
            <button class="mz__arrow" @click="step('right')">→</button>
            <span></span>
            <button class="mz__arrow" @click="step('down')">↓</button>
            <span></span>
          </div>

          <button type="button" class="mz__reset" @click="reset">
            {{ resetLabel }}
          </button>

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
  grid-template-columns: minmax(280px, 1.5fr) minmax(220px, 1fr);
  gap: 1.5rem;
  align-items: start;
}
@media (max-width: 820px) {
  .mz__layout {
    grid-template-columns: 1fr;
  }
}

.mz__board {
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
    left 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    top 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.mz__panel {
  display: grid;
  gap: 1rem;
  justify-items: center;
}
.mz__counter {
  display: inline-flex;
  align-items: baseline;
  gap: 0.6rem;
  background: var(--color-surface);
  padding: 0.6rem 1.1rem;
  border-radius: 999px;
  box-shadow: var(--shadow-card);
}
.mz__counter-label {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--color-fg-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.mz__counter-num {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.5rem;
  color: var(--color-fg);
}

.mz__pad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  width: 100%;
  max-width: 240px;
}
.mz__arrow {
  height: clamp(56px, 14vw, 64px);
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: 1.6rem;
  font-weight: 700;
  box-shadow: var(--shadow-card);
}
.mz__arrow.is-secondary {
  background: var(--color-bg-deep);
  font-size: 1.25rem;
}
.mz__arrow:active {
  transform: scale(0.95);
}

.mz__reset {
  height: 48px;
  padding: 0 1.5rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-bg-deep);
  color: var(--color-fg);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
}

.mz__voice {
  display: grid;
  justify-items: center;
  gap: 0.4rem;
  padding-top: 0.5rem;
  border-top: 1px dashed rgba(31, 37, 64, 0.1);
  width: 100%;
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
