<script setup lang="ts">
import { motion } from 'motion-v'

const { data: chapters } = await useAsyncData('chapters-list', () =>
  queryCollection('chapters').order('order', 'ASC').all(),
)
</script>

<template>
  <main class="home">
    <!-- HERO: parallax sky -->
    <section class="hero">
      <ParallaxSky />

      <div class="hero__content">
        <motion.p
          class="hero__kicker"
          :initial="{ opacity: 0, y: 24 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.8, delay: 0.2 }"
        >
          NowWeKnow · Episode 01
        </motion.p>

        <motion.h1
          class="hero__title"
          :initial="{ opacity: 0, y: 32 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 1, delay: 0.4 }"
        >
          Why is the sky <em>blue</em>?
        </motion.h1>

        <motion.p
          class="hero__sub"
          :initial="{ opacity: 0, y: 24 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.8, delay: 0.7 }"
        >
          A 10-minute scroll through the physics of light, air, and the
          everyday miracle above your head.
        </motion.p>

        <motion.a
          href="#chapter"
          class="hero__cta"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="{ duration: 0.8, delay: 1.1 }"
          :whileHover="{ y: -2 }"
        >
          Begin
          <span class="hero__cta-arrow">↓</span>
        </motion.a>
      </div>

      <motion.div
        class="hero__scroll-hint"
        :animate="{ y: [0, 8, 0] }"
        :transition="{ duration: 2, repeat: Infinity, ease: 'easeInOut' }"
      >
        scroll
      </motion.div>
    </section>

    <!-- CHAPTER 1 -->
    <section id="chapter" class="chapter">
      <ChapterSkyBlue />
    </section>

    <!-- INDEX -->
    <section v-if="chapters?.length" class="index">
      <div class="index__inner">
        <p class="index__eyebrow">More episodes</p>
        <ul class="index__list">
          <li v-for="c in chapters" :key="c.path" class="index__item">
            <span class="index__num">{{ String(c.order).padStart(2, '0') }}</span>
            <div>
              <h3 class="index__title">{{ c.title }}</h3>
              <p v-if="c.summary" class="index__summary">{{ c.summary }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <footer class="footer">
      <p>NowWeKnow · made for the curious</p>
    </footer>
  </main>
</template>

<style scoped>
.home {
  position: relative;
}

/* HERO */
.hero {
  position: relative;
  height: 100dvh;
  min-height: 600px;
  display: grid;
  place-items: center;
  overflow: hidden;
  isolation: isolate;
}

.hero__content {
  position: relative;
  z-index: 5;
  text-align: center;
  padding: 0 2rem;
  max-width: 720px;
}

.hero__kicker {
  font-size: 0.8rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin: 0 0 1.5rem;
  text-shadow: var(--shadow-text);
}

.hero__title {
  font-size: clamp(3rem, 9vw, 7rem);
  font-weight: 300;
  margin: 0;
  text-shadow: var(--shadow-text);
}

.hero__title em {
  font-style: italic;
  background: linear-gradient(180deg, #93c5fd 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero__sub {
  margin: 1.5rem auto 2rem;
  font-size: clamp(1rem, 1.5vw, 1.15rem);
  color: var(--color-fg-muted);
  max-width: 50ch;
  text-shadow: var(--shadow-text);
}

.hero__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 2rem;
  border: 1px solid var(--color-accent);
  border-radius: 999px;
  color: var(--color-accent);
  font-size: 0.9rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  background: rgba(10, 20, 40, 0.35);
  backdrop-filter: blur(6px);
  transition: background 0.3s, color 0.3s;
}

.hero__cta:hover {
  background: var(--color-accent);
  color: var(--color-bg-deep);
}

.hero__cta-arrow {
  display: inline-block;
  font-size: 1.1em;
}

.hero__scroll-hint {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--color-fg-muted);
  z-index: 5;
}

/* CHAPTER */
.chapter {
  position: relative;
  background: linear-gradient(180deg, #0a1428 0%, #050a18 100%);
}

/* INDEX */
.index {
  background: var(--color-bg-deep);
  padding: 8rem 2rem 6rem;
}
.index__inner {
  max-width: 720px;
  margin: 0 auto;
}
.index__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--color-fg-muted);
  margin: 0 0 3rem;
}
.index__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 2rem;
}
.index__item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.index__num {
  font-family: var(--font-serif);
  font-size: 2rem;
  color: var(--color-accent);
  font-weight: 300;
}
.index__title {
  font-size: 1.5rem;
  margin: 0 0 0.5rem;
}
.index__summary {
  margin: 0;
  color: var(--color-fg-muted);
  font-size: 0.95rem;
}

/* FOOTER */
.footer {
  padding: 3rem 2rem;
  text-align: center;
  font-size: 0.8rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--color-fg-muted);
  background: var(--color-bg-deep);
}
</style>
