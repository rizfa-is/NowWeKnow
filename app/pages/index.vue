<script setup lang="ts">
import { motion } from 'motion-v'
import type { AgeBand, Locale, WorksheetType } from '~/types/worksheet'

const locale = useLocale()

const { data: worksheets } = await useAsyncData('worksheets-list', () =>
  queryCollection('worksheets').order('order', 'ASC').all(),
)

interface BandMeta {
  key: AgeBand
  label: Record<Locale, string>
  caption: Record<Locale, string>
  color: string
}

const bands: BandMeta[] = [
  {
    key: 'paud',
    label: { en: 'PAUD / TK', id: 'PAUD / TK' },
    caption: { en: 'Ages 3 – 6', id: 'Usia 3 – 6' },
    color: 'var(--color-pink)',
  },
  {
    key: 'sd-low',
    label: { en: 'SD · Grade 1–3', id: 'SD · Kelas 1–3' },
    caption: { en: 'Ages 7 – 9', id: 'Usia 7 – 9' },
    color: 'var(--color-blue)',
  },
  {
    key: 'sd-high',
    label: { en: 'SD · Grade 4–6', id: 'SD · Kelas 4–6' },
    caption: { en: 'Ages 10 – 12', id: 'Usia 10 – 12' },
    color: 'var(--color-purple)',
  },
]

const grouped = computed(() => {
  const map = new Map<AgeBand, typeof worksheets.value>()
  for (const band of bands) map.set(band.key, [])
  for (const w of worksheets.value ?? []) {
    const list = map.get(w.ageBand as AgeBand)
    if (list) list.push(w)
  }
  return map
})

const typeIcons: Record<WorksheetType, string> = {
  color: '🎨',
  sequence: '🍎',
  move: '🐰',
  maze: '🗺️',
  loop: '🔁',
}

function slugFromPath(path: string): string {
  // Nuxt Content paths look like "/worksheets/paud/colors-of-the-rainbow"
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? ''
}

const heroTitle = computed(() => (locale.value === 'id'
  ? 'Lembar kerja koding yang mendengarkan kembali.'
  : 'Coding worksheets that listen back.'))

const heroSub = computed(() => (locale.value === 'id'
  ? 'Pilih jenjang dan latihan. Tekan tombol mikrofon, anak menjawab dengan suara atau sentuhan.'
  : 'Pick a band and a worksheet. Tap the mic — kids answer by voice or touch.'))

const emptyMsg = computed(() => (locale.value === 'id' ? 'Belum ada lembar kerja.' : 'No worksheets yet.'))
</script>

<template>
  <main class="picker">
    <header class="picker__head">
      <div class="picker__brand">
        <span class="picker__brand-mark">●</span>
        <span class="picker__brand-name">NowWeKnow</span>
      </div>
      <LocaleToggle />
    </header>

    <section class="picker__hero">
      <motion.h1
        class="picker__title"
        :initial="{ opacity: 0, y: 16 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5 }"
      >
        {{ heroTitle }}
      </motion.h1>
      <motion.p
        class="picker__sub"
        :initial="{ opacity: 0, y: 16 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5, delay: 0.1 }"
      >
        {{ heroSub }}
      </motion.p>
    </section>

    <section
      v-for="band in bands"
      :key="band.key"
      class="picker__band"
    >
      <header class="picker__band-head" :style="{ '--band-color': band.color }">
        <h2 class="picker__band-title">{{ band.label[locale] }}</h2>
        <span class="picker__band-caption">{{ band.caption[locale] }}</span>
      </header>

      <ul v-if="grouped.get(band.key)?.length" class="picker__cards">
        <motion.li
          v-for="(w, i) in grouped.get(band.key)"
          :key="w.path"
          class="picker__card"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.4, delay: i * 0.05 }"
        >
          <NuxtLink :to="`/play/${slugFromPath(w.path)}`" class="picker__card-link">
            <span class="picker__card-icon" :style="{ background: w.accent || band.color }">
              {{ typeIcons[w.type as WorksheetType] }}
            </span>
            <span class="picker__card-body">
              <strong class="picker__card-title">{{ w.title[locale] }}</strong>
              <span class="picker__card-concept">{{ w.concept }}</span>
            </span>
            <span class="picker__card-arrow" aria-hidden="true">→</span>
          </NuxtLink>
        </motion.li>
      </ul>
      <p v-else class="picker__empty">{{ emptyMsg }}</p>
    </section>

    <footer class="picker__foot">
      <p>NowWeKnow · {{ locale === 'id' ? 'untuk anak yang ingin tahu' : 'for the curious' }}</p>
    </footer>
  </main>
</template>

<style scoped>
.picker {
  min-height: 100dvh;
  padding: 1.5rem 2rem 4rem;
  max-width: 1200px;
  margin: 0 auto;
}
.picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3rem;
}
.picker__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.1rem;
}
.picker__brand-mark {
  color: var(--color-accent);
  font-size: 1.4rem;
}

.picker__hero {
  max-width: 720px;
  margin: 0 auto 4rem;
  text-align: center;
}
.picker__title {
  font-size: clamp(2.25rem, 5vw, 3.5rem);
  font-weight: 700;
  margin: 0 0 0.75rem;
}
.picker__sub {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-fg-muted);
  line-height: 1.5;
}

.picker__band {
  margin-bottom: 3rem;
}
.picker__band-head {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px dashed rgba(31, 37, 64, 0.08);
}
.picker__band-title {
  margin: 0;
  font-size: 1.4rem;
  position: relative;
  padding-left: 1.25rem;
}
.picker__band-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--band-color);
}
.picker__band-caption {
  color: var(--color-fg-muted);
  font-size: 0.95rem;
  letter-spacing: 0.04em;
}

.picker__cards {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.picker__card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.picker__card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-pop);
}
.picker__card-link {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  color: inherit;
  text-decoration: none;
}
.picker__card-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 1.75rem;
  color: var(--color-white);
}
.picker__card-body {
  display: grid;
  gap: 2px;
}
.picker__card-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.05rem;
}
.picker__card-concept {
  color: var(--color-fg-muted);
  font-size: 0.85rem;
}
.picker__card-arrow {
  color: var(--color-accent);
  font-size: 1.4rem;
  font-weight: 700;
}

.picker__empty {
  color: var(--color-fg-muted);
  font-style: italic;
  margin: 0;
}

.picker__foot {
  margin-top: 4rem;
  text-align: center;
  color: var(--color-fg-muted);
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
</style>
