<script setup lang="ts">
// Placeholder home — will be replaced by the worksheet picker in Phase 1d.
</script>

<template>
  <main class="home">
    <div class="home__inner">
      <p class="home__kicker">NowWeKnow</p>
      <h1 class="home__title">Coding worksheets that listen back.</h1>
      <p class="home__sub">Voice-first digital worksheets for PAUD/TK and SD. Coming soon.</p>
    </div>
  </main>
</template>

<style scoped>
.home {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 2rem;
}
.home__inner {
  max-width: 640px;
  text-align: center;
}
.home__kicker {
  font-size: 0.8rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin: 0 0 1.5rem;
}
.home__title {
  font-size: clamp(2.25rem, 6vw, 4rem);
  font-weight: 300;
  margin: 0 0 1rem;
}
.home__sub {
  color: var(--color-fg-muted);
  font-size: 1.1rem;
}
</style>
