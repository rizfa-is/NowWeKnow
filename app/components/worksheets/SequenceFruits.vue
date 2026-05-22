<script setup lang="ts">
import { motion } from 'motion-v'
import type { Locale, LocalizedString, PhraseDictionary, WorksheetMeta } from '~/types/worksheet'

interface SequenceItem {
  id: string
  emoji: string
  name: { en: string, id: string }
}

interface SequenceData {
  prompts: Array<{
    items: SequenceItem[] // Already in correct order
  }>
}

const props = defineProps<{
  worksheet: WorksheetMeta
}>()

const data = computed(() => props.worksheet.data as unknown as SequenceData)
const prompts = computed(() => data.value?.prompts ?? [])

const locale = useLocale()
const voice = useVoice()

const stepIndex = ref(0)
const feedback = ref<'idle' | 'correct' | 'wrong'>('idle')
const showHint = ref(false)

const current = computed(() => prompts.value[stepIndex.value])
const done = computed(() => stepIndex.value >= prompts.value.length)

// User's current selection in order. Each entry is the item.id.
const picked = ref<string[]>([])

// Shuffled tray of items the user can pick from.
const tray = ref<SequenceItem[]>([])

const promptCopy = computed<Record<Locale, string>>(() => ({
  en: 'Tap or say each item in the right order.',
  id: 'Sentuh atau sebutkan setiap benda sesuai urutan.',
}))

const positionWords: Record<number, LocalizedString> = {
  0: { en: 'First', id: 'Pertama' },
  1: { en: 'Then', id: 'Lalu' },
  2: { en: 'After', id: 'Setelah itu' },
  3: { en: 'Then', id: 'Lalu' },
  4: { en: 'Last', id: 'Terakhir' },
}

const expectedItem = computed<SequenceItem | null>(() => {
  if (!current.value) return null
  return current.value.items[picked.value.length] ?? null
})

const itemPhrases = computed<PhraseDictionary>(() => {
  const dict: PhraseDictionary = {}
  if (!current.value) return dict
  for (const item of current.value.items) {
    dict[item.id] = {
      en: [item.name.en],
      id: [item.name.id],
    }
  }
  return dict
})

const hint = computed<LocalizedString>(() => ({
  en: expectedItem.value
    ? `Next: ${expectedItem.value.name.en}`
    : '',
  id: expectedItem.value
    ? `Selanjutnya: ${expectedItem.value.name.id}`
    : '',
}))

watch(current, (c) => {
  picked.value = []
  if (c) tray.value = [...c.items].sort(() => Math.random() - 0.5)
}, { immediate: true })

function pickItem(item: SequenceItem) {
  if (!expectedItem.value) return
  if (item.id === expectedItem.value.id) {
    picked.value.push(item.id)
    voice.reset()
    feedback.value = 'correct'
    setTimeout(() => { feedback.value = 'idle' }, 500)
    if (picked.value.length === current.value?.items.length) {
      // Whole sequence complete -> advance
      setTimeout(() => {
        stepIndex.value += 1
        showHint.value = false
      }, 700)
    }
  }
  else {
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

watch(voice.isFinal, (final) => {
  if (!final) return
  const result = voice.evaluate(itemPhrases.value)
  if (!result.matched) {
    feedback.value = 'wrong'
    setTimeout(() => { feedback.value = 'idle' }, 700)
    return
  }
  const item = current.value?.items.find(i => i.id === result.matched)
  if (item) pickItem(item)
})

const isPicked = (id: string) => picked.value.includes(id)

const tapToTalk = computed(() => (locale.value === 'id' ? 'Tekan dan bicara' : 'Tap to speak'))
const completeMsg = computed(() => (locale.value === 'id'
  ? 'Urutannya sempurna!'
  : 'Perfect order!'))
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
    <div v-if="!done && current" class="seq">
      <p class="seq__prompt">{{ promptCopy[locale] }}</p>

      <div class="seq__plan" :aria-label="locale === 'id' ? 'Urutan' : 'Order'">
        <div
          v-for="(item, i) in current.items"
          :key="`slot-${i}`"
          class="seq__slot"
          :class="{ 'is-filled': i < picked.length, 'is-active': i === picked.length }"
        >
          <span class="seq__slot-num">
            {{ positionWords[i]?.[locale] || `${i + 1}.` }}
          </span>
          <span v-if="i < picked.length" class="seq__slot-item">
            {{ current.items.find(x => x.id === picked[i])?.emoji }}
          </span>
        </div>
      </div>

      <div class="seq__voice">
        <MicButton
          :listening="voice.isListening.value"
          :supported="voice.isSupported.value"
          @press="onListenPress"
        />
        <p class="seq__voice-label">
          {{ voice.isListening.value ? '...' : tapToTalk }}
        </p>
        <p v-if="voice.transcript.value" class="seq__transcript">
          "{{ voice.transcript.value }}"
        </p>
      </div>

      <ul class="seq__tray">
        <motion.li
          v-for="item in tray"
          :key="item.id"
          :animate="isPicked(item.id) ? { opacity: 0.25, scale: 0.92 } : { opacity: 1, scale: 1 }"
          :transition="{ duration: 0.25 }"
        >
          <button
            type="button"
            class="seq__chip"
            :disabled="isPicked(item.id)"
            @click="pickItem(item)"
          >
            <span class="seq__chip-emoji">{{ item.emoji }}</span>
            <span class="seq__chip-name">{{ item.name[locale] }}</span>
          </button>
        </motion.li>
      </ul>
    </div>

    <div v-else class="seq__done">
      <motion.div
        class="seq__done-emoji"
        :animate="{ rotate: [0, -8, 8, -8, 0] }"
        :transition="{ duration: 1, repeat: Infinity, repeatDelay: 0.8 }"
      >
        ⭐
      </motion.div>
      <h2>{{ completeMsg }}</h2>
      <NuxtLink to="/" class="seq__home-btn">
        {{ locale === 'id' ? 'Kembali' : 'Back home' }}
      </NuxtLink>
    </div>
  </WorksheetShell>
</template>

<style scoped>
.seq {
  display: grid;
  gap: 1.5rem;
  justify-items: center;
  width: 100%;
  max-width: 800px;
}
.seq__prompt {
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  font-weight: 600;
  margin: 0;
  text-align: center;
}

.seq__plan {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(110px, 1fr);
  gap: 0.75rem;
  width: 100%;
  max-width: 720px;
}
.seq__slot {
  height: 120px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 2px dashed rgba(31, 37, 64, 0.18);
  display: grid;
  place-items: center;
  gap: 0.25rem;
  text-align: center;
  padding: 0.5rem;
  transition: border-color 0.2s, background 0.2s;
}
.seq__slot.is-active {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}
.seq__slot.is-filled {
  border-style: solid;
  border-color: var(--color-success);
  background: rgba(6, 214, 160, 0.1);
}
.seq__slot-num {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-fg-muted);
  letter-spacing: 0.06em;
}
.seq__slot-item {
  font-size: 2.5rem;
}

.seq__voice {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
}
.seq__voice-label {
  font-family: var(--font-display);
  font-weight: 600;
  margin: 0;
}
.seq__transcript {
  margin: 0;
  color: var(--color-fg-muted);
  font-style: italic;
  text-transform: capitalize;
}

.seq__tray {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}
.seq__chip {
  display: inline-grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem 0.5rem 0.5rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1rem;
  height: 64px;
  transition: transform 0.15s;
}
.seq__chip:not(:disabled):active {
  transform: scale(0.96);
}
.seq__chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.seq__chip-emoji {
  font-size: 2rem;
}

.seq__done {
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 1.5rem;
}
.seq__done-emoji {
  font-size: 4rem;
}
.seq__home-btn {
  padding: 0.85rem 1.75rem;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-white);
  font-family: var(--font-display);
  font-weight: 600;
}
</style>
