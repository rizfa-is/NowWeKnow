<script setup lang="ts">
const { progress } = defineProps<{ progress: number }>()
</script>

<template>
  <div class="loader" role="status" aria-live="polite">
    <div class="loader__bg" />
    <div class="loader__center">
      <div class="loader__sun" />
      <p class="loader__brand">NowWeKnow</p>
      <p class="loader__tag">An immersive series of everyday science</p>
      <p class="loader__count">
        <span>{{ progress }}</span><span class="loader__pct">%</span>
      </p>
      <div class="loader__bar">
        <div class="loader__bar-fill" :style="{ width: `${progress}%` }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: radial-gradient(
    ellipse at 50% 60%,
    #16294a 0%,
    #0a1428 45%,
    #050a18 100%
  );
  display: grid;
  place-items: center;
  overflow: hidden;
}

.loader__bg {
  position: absolute;
  inset: -10%;
  background:
    radial-gradient(circle at 20% 30%, rgba(246, 206, 160, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(106, 168, 255, 0.05) 0%, transparent 50%);
  animation: drift 18s linear infinite alternate;
}

.loader__center {
  position: relative;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 0 2rem;
}

.loader__sun {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--color-sun) 0%,
    var(--color-accent) 55%,
    rgba(246, 206, 160, 0) 75%
  );
  box-shadow: 0 0 80px rgba(246, 206, 160, 0.55);
  animation: pulse 3.5s ease-in-out infinite;
}

.loader__brand {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: 0.04em;
  margin: 0;
  color: var(--color-accent);
}

.loader__tag {
  font-size: 0.85rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin: 0;
  color: var(--color-fg-muted);
}

.loader__count {
  font-family: var(--font-serif);
  font-size: clamp(2.5rem, 6vw, 4rem);
  margin: 0.5rem 0 0;
  color: var(--color-fg);
  font-feature-settings: 'tnum';
  display: inline-flex;
  align-items: baseline;
  gap: 0.1em;
}

.loader__pct {
  font-size: 0.5em;
  color: var(--color-fg-muted);
}

.loader__bar {
  width: min(280px, 60vw);
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.loader__bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), var(--color-sun));
  transition: width 0.2s ease-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.95; }
  50%      { transform: scale(1.05); opacity: 1; }
}

@keyframes drift {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(2%, -2%, 0); }
}
</style>
