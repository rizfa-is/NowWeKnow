<script setup lang="ts">
import { useScroll, useElementBounding } from '@vueuse/core'
import { motion } from 'motion-v'

const root = ref<HTMLElement | null>(null)
const { y: scrollY } = useScroll(import.meta.client ? window : null)
const { top, height } = useElementBounding(root)

// Progress through the chapter section: 0 → 1
const progress = computed(() => {
  if (!import.meta.client || !height.value) return 0
  const viewport = window.innerHeight
  const total = height.value - viewport
  if (total <= 0) return 0
  // top becomes negative as we scroll past the section start
  const scrolled = -top.value
  return Math.max(0, Math.min(1, scrolled / total))
})

// Map scroll progress into stages 0..4
const stage = computed(() => Math.min(4, Math.floor(progress.value * 5)))

// Sky tint shifts with progress: blue → orange (sunset reveal)
const skyTint = computed(() => {
  const p = progress.value
  // mix from blue (top) to warm (bottom)
  const r = Math.round(29 + (255 - 29) * p * 0.6)
  const g = Math.round(78 + (154 - 78) * p * 0.5)
  const b = Math.round(216 - (216 - 85) * p * 0.6)
  return `rgb(${r}, ${g}, ${b})`
})

// Pull the chapter copy from Nuxt Content
const { data: chapter } = await useAsyncData('chapter-sky-blue', () =>
  queryCollection('chapters').path('/chapters/why-is-the-sky-blue').first(),
)

const wavelengths = [
  { name: 'Violet', color: '#b488ff', nm: 380, scatter: 0.95 },
  { name: 'Blue',   color: '#6aa8ff', nm: 470, scatter: 0.85 },
  { name: 'Green',  color: '#7be39e', nm: 540, scatter: 0.45 },
  { name: 'Yellow', color: '#ffd96a', nm: 580, scatter: 0.30 },
  { name: 'Orange', color: '#ff9a55', nm: 620, scatter: 0.20 },
  { name: 'Red',    color: '#ff5a5a', nm: 700, scatter: 0.10 },
]
</script>

<template>
  <article ref="root" class="sb">
    <!-- Sticky scene that all stages animate on top of -->
    <div class="sb__sticky">
      <div class="sb__scene" :style="{ background: skyTint }">
        <!-- Sun -->
        <motion.div
          class="sb__sun"
          :animate="{
            x: progress * 200,
            y: progress * 120,
            scale: 1 - progress * 0.2,
          }"
          :transition="{ type: 'spring', stiffness: 30, damping: 20 }"
        />

        <!-- Atmosphere band shown after stage 0 -->
        <Transition name="fade">
          <div v-if="stage >= 1" class="sb__atmosphere">
            <div class="sb__layer sb__layer--exo">Exosphere</div>
            <div class="sb__layer sb__layer--thermo">Thermosphere</div>
            <div class="sb__layer sb__layer--meso">Mesosphere</div>
            <div class="sb__layer sb__layer--strato">Stratosphere</div>
            <div class="sb__layer sb__layer--tropo">Troposphere</div>
          </div>
        </Transition>

        <!-- Wavelength prism shown at stage 2 -->
        <Transition name="fade">
          <div v-if="stage >= 2" class="sb__prism">
            <div class="sb__prism-beam" />
            <div
              v-for="(w, i) in wavelengths"
              :key="w.name"
              class="sb__wave"
              :style="{
                background: w.color,
                top: `${20 + i * 9}%`,
                width: `${30 + w.scatter * 60}%`,
                opacity: 0.85,
                animationDelay: `${i * 0.1}s`,
              }"
            >
              <span class="sb__wave-label">
                {{ w.name }}
                <em>{{ w.nm }}nm</em>
              </span>
            </div>
          </div>
        </Transition>

        <!-- Scattering molecules at stage 3 -->
        <div v-if="stage >= 3" class="sb__molecules">
          <span
            v-for="i in 24"
            :key="i"
            class="sb__molecule"
            :style="{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 90}%`,
              animationDelay: `${(i % 6) * 0.3}s`,
            }"
          />
        </div>

        <!-- Final eye shown at stage 4 -->
        <Transition name="fade">
          <div v-if="stage >= 4" class="sb__eye">
            <svg viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="#fff" />
              <circle cx="40" cy="40" r="18" :fill="skyTint" />
              <circle cx="40" cy="40" r="8" fill="#0a1428" />
              <circle cx="35" cy="35" r="3" fill="#fff" opacity="0.8" />
            </svg>
          </div>
        </Transition>
      </div>

      <!-- Side rail with progress -->
      <aside class="sb__rail" aria-hidden="true">
        <div class="sb__rail-track">
          <div class="sb__rail-fill" :style="{ height: `${progress * 100}%` }" />
        </div>
        <ol class="sb__rail-stages">
          <li :class="{ active: stage >= 0 }">Sun</li>
          <li :class="{ active: stage >= 1 }">Air</li>
          <li :class="{ active: stage >= 2 }">Light</li>
          <li :class="{ active: stage >= 3 }">Scatter</li>
          <li :class="{ active: stage >= 4 }">You</li>
        </ol>
      </aside>
    </div>

    <!-- Scrolling text panels -->
    <div class="sb__panels">
      <ChapterPanel
        kicker="01 · The Sun"
        title="It begins with sunlight."
      >
        Every photon that paints your sky started its journey 8 minutes ago,
        deep inside the Sun. What looks like white light is really every
        colour at once, traveling in tidy electromagnetic waves.
      </ChapterPanel>

      <ChapterPanel
        kicker="02 · The Air"
        title="It runs into our atmosphere."
      >
        100 kilometres of nitrogen and oxygen sit between you and space.
        From far away it looks empty. Up close, it is a dense forest of
        molecules — a few hundred billion in every cubic centimetre of the
        air around you.
      </ChapterPanel>

      <ChapterPanel
        kicker="03 · The Light"
        title="Different colours, different wavelengths."
      >
        Red light has long, lazy waves. Blue and violet are short and wiry.
        That single difference decides which colours pass through air, and
        which colours get pushed around.
      </ChapterPanel>

      <ChapterPanel
        kicker="04 · The Scatter"
        title="Air loves blue light."
        accent
      >
        Tiny molecules scatter short wavelengths much more strongly than
        long ones — by a factor of <em>roughly the wavelength to the power
        of minus four</em>. Blue light gets bounced around the sky in every
        direction. That bounced blue is what reaches your eyes from
        everywhere overhead.
      </ChapterPanel>

      <ChapterPanel
        kicker="05 · You"
        title="And so the sky looks blue."
      >
        Look up. The dome above you is glowing with scattered blue light.
        At sunset the geometry changes — sunlight travels through more air,
        so even more blue is scattered away before it reaches you, and
        you're left with the warm reds and oranges of the leftovers.
      </ChapterPanel>
    </div>

    <!-- Markdown body (optional supplementary copy from Nuxt Content) -->
    <div v-if="chapter" class="sb__body">
      <div class="sb__body-inner prose">
        <ContentRenderer :value="chapter" />
      </div>
    </div>
  </article>
</template>

<style scoped>
.sb {
  position: relative;
}

.sb__sticky {
  position: sticky;
  top: 0;
  height: 100dvh;
  display: grid;
  grid-template-columns: 1fr auto;
  z-index: 1;
}

.sb__scene {
  position: relative;
  overflow: hidden;
  transition: background 0.6s ease-out;
}

.sb__sun {
  position: absolute;
  top: 12%;
  left: 12%;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color-sun), var(--color-accent));
  box-shadow: 0 0 80px rgba(246, 206, 160, 0.6);
  will-change: transform;
}

/* Atmosphere bands */
.sb__atmosphere {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none;
}
.sb__layer {
  flex: 1;
  display: flex;
  align-items: center;
  padding-left: 2rem;
  font-size: 0.7rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  border-top: 1px dashed rgba(255, 255, 255, 0.15);
}
.sb__layer--exo    { background: rgba(0, 0, 30, 0.05); }
.sb__layer--thermo { background: rgba(80, 100, 200, 0.06); }
.sb__layer--meso   { background: rgba(120, 160, 255, 0.07); }
.sb__layer--strato { background: rgba(200, 220, 255, 0.08); }
.sb__layer--tropo  { background: rgba(255, 255, 255, 0.10); }

/* Prism + waves */
.sb__prism {
  position: absolute;
  top: 0;
  left: 0;
  width: 60%;
  height: 100%;
  pointer-events: none;
}
.sb__prism-beam {
  position: absolute;
  top: 18%;
  left: 0;
  width: 30%;
  height: 4px;
  background: linear-gradient(90deg, transparent, #fff, transparent);
}
.sb__wave {
  position: absolute;
  left: 30%;
  height: 3px;
  border-radius: 3px;
  animation: wiggle 1.6s ease-in-out infinite;
  box-shadow: 0 0 12px currentColor;
}
.sb__wave-label {
  position: absolute;
  left: calc(100% + 0.75rem);
  top: -0.6rem;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #fff;
  white-space: nowrap;
}
.sb__wave-label em {
  margin-left: 0.5em;
  color: rgba(255, 255, 255, 0.6);
  font-style: normal;
  font-feature-settings: 'tnum';
}
@keyframes wiggle {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(4px); }
}

/* Scattering molecules */
.sb__molecules {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.sb__molecule {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(106, 168, 255, 0.6);
  box-shadow: 0 0 16px rgba(106, 168, 255, 0.4);
  animation: scatter 2.4s ease-in-out infinite;
}
@keyframes scatter {
  0%, 100% { transform: translate(0, 0); opacity: 0.4; }
  50%      { transform: translate(20px, -20px); opacity: 0.9; }
}

/* Eye */
.sb__eye {
  position: absolute;
  bottom: 8%;
  left: 50%;
  width: 96px;
  height: 96px;
  margin-left: -48px;
  filter: drop-shadow(0 0 24px rgba(106, 168, 255, 0.5));
}
.sb__eye svg {
  width: 100%;
  height: 100%;
}

/* Side rail */
.sb__rail {
  position: relative;
  width: 200px;
  padding: 4rem 2rem;
  background: rgba(5, 10, 24, 0.45);
  backdrop-filter: blur(8px);
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  gap: 1.25rem;
}
.sb__rail-track {
  position: relative;
  width: 2px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
}
.sb__rail-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(180deg, var(--color-accent), var(--color-blue));
  border-radius: 2px;
  transition: height 0.2s ease-out;
}
.sb__rail-stages {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.sb__rail-stages li {
  font-size: 0.75rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--color-fg-muted);
  transition: color 0.3s;
}
.sb__rail-stages li.active {
  color: var(--color-accent);
}

/* Scrolling panels */
.sb__panels {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

/* Body markdown */
.sb__body {
  position: relative;
  z-index: 2;
  padding: 8rem 2rem;
  background: var(--color-bg-deep);
}
.sb__body-inner {
  max-width: 640px;
  margin: 0 auto;
}

/* Mobile rail */
@media (max-width: 720px) {
  .sb__sticky { grid-template-columns: 1fr; }
  .sb__rail   { display: none; }
}

/* Vue transitions */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.6s; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }
</style>
