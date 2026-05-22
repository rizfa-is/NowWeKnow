<script setup lang="ts">
import { useMouse, useWindowSize, useScroll } from '@vueuse/core'

// Mouse-follow parallax for the hero (subtle 3D feel without WebGL)
const { x, y } = useMouse({ type: 'client' })
const { width, height } = useWindowSize()

const heroRef = ref<HTMLElement | null>(null)
const { y: scrollY } = useScroll(import.meta.client ? window : null)

// Normalised mouse position centered around 0 (-0.5..0.5)
const mx = computed(() =>
  width.value ? (x.value - width.value / 2) / width.value : 0,
)
const my = computed(() =>
  height.value ? (y.value - height.value / 2) / height.value : 0,
)

// Layer transforms — depth = how far each layer moves
function layerStyle(depthX: number, depthY: number, scrollFactor = 0) {
  const px = mx.value * depthX
  const py = my.value * depthY + scrollY.value * scrollFactor
  return {
    transform: `translate3d(${px}px, ${py}px, 0)`,
  }
}

// Pre-generate stars once on client
const stars = computed(() => {
  if (!import.meta.client) return []
  return Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 70,
    size: Math.random() * 2 + 0.5,
    delay: Math.random() * 4,
  }))
})
</script>

<template>
  <div ref="heroRef" class="sky" aria-hidden="true">
    <!-- Layer 1: deep sky gradient (no movement) -->
    <div class="sky__bg" />

    <!-- Layer 2: distant stars (slowest) -->
    <div class="sky__stars" :style="layerStyle(8, 5, 0.05)">
      <span
        v-for="s in stars"
        :key="s.id"
        class="sky__star"
        :style="{
          left: `${s.left}%`,
          top: `${s.top}%`,
          width: `${s.size}px`,
          height: `${s.size}px`,
          animationDelay: `${s.delay}s`,
        }"
      />
    </div>

    <!-- Layer 3: atmosphere haze -->
    <div class="sky__haze" :style="layerStyle(20, 10, 0.15)" />

    <!-- Layer 4: sun -->
    <div class="sky__sun-wrap" :style="layerStyle(35, 22, 0.2)">
      <div class="sky__sun" />
      <div class="sky__sun-glow" />
    </div>

    <!-- Layer 5: light beams scattering in atmosphere -->
    <div class="sky__beams" :style="layerStyle(45, 28, 0.25)">
      <div class="sky__beam sky__beam--1" />
      <div class="sky__beam sky__beam--2" />
      <div class="sky__beam sky__beam--3" />
    </div>

    <!-- Layer 6: foreground horizon silhouette -->
    <div class="sky__horizon" :style="layerStyle(60, 12, 0.4)">
      <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path
          d="M0,224 C160,180 320,260 480,240 C640,220 720,160 880,180 C1040,200 1200,260 1440,220 L1440,320 L0,320 Z"
          fill="#050a18"
          opacity="0.9"
        />
      </svg>
    </div>

    <!-- Layer 7: viewer (closest) -->
    <div class="sky__viewer" :style="layerStyle(85, 18, 0.55)">
      <svg viewBox="0 0 200 240" aria-hidden="true">
        <!-- minimalist person silhouette looking up -->
        <ellipse cx="100" cy="240" rx="60" ry="6" fill="#000" opacity="0.4" />
        <path
          d="M100,90 C115,90 125,100 125,115 C125,130 115,140 100,140 C85,140 75,130 75,115 C75,100 85,90 100,90 Z M85,140 L70,235 L130,235 L115,140 Z"
          fill="#0a1428"
          stroke="#1d2c4a"
          stroke-width="1"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.sky {
  position: absolute;
  inset: 0;
  overflow: hidden;
  perspective: 1000px;
  z-index: 1;
}

.sky__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 120% 80% at 70% 25%, #fff4d6 0%, transparent 25%),
    radial-gradient(ellipse 140% 100% at 50% 0%, #93c5fd 0%, transparent 40%),
    linear-gradient(180deg,
      #1d4ed8 0%,
      #3b82f6 25%,
      #6aa8ff 55%,
      #f6cea0 85%,
      #ff9a55 100%
    );
}

/* Stars (only really visible at the deep blue top) */
.sky__stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
  will-change: transform;
}
.sky__star {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  opacity: 0.6;
  animation: twinkle 4s ease-in-out infinite;
}
@keyframes twinkle {
  0%, 100% { opacity: 0.2; }
  50%      { opacity: 0.7; }
}

/* Atmospheric haze layer */
.sky__haze {
  position: absolute;
  inset: -10%;
  background:
    radial-gradient(ellipse 60% 30% at 30% 60%, rgba(255, 255, 255, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse 80% 40% at 75% 70%, rgba(246, 206, 160, 0.08) 0%, transparent 60%);
  filter: blur(12px);
  will-change: transform;
}

/* Sun */
.sky__sun-wrap {
  position: absolute;
  top: 18%;
  right: 18%;
  width: 180px;
  height: 180px;
  will-change: transform;
}
.sky__sun {
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color-sun) 0%, var(--color-accent) 80%);
  box-shadow: 0 0 60px var(--color-accent);
}
.sky__sun-glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(246, 206, 160, 0.35) 0%, transparent 60%);
  animation: sun-pulse 5s ease-in-out infinite;
}
@keyframes sun-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.15); }
}

/* Light beams */
.sky__beams {
  position: absolute;
  top: 22%;
  right: 26%;
  width: 600px;
  height: 600px;
  pointer-events: none;
  will-change: transform;
}
.sky__beam {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 400px;
  height: 80px;
  background: linear-gradient(90deg, rgba(255, 244, 214, 0.18), transparent 70%);
  transform-origin: 0 50%;
  filter: blur(2px);
}
.sky__beam--1 { transform: rotate(15deg); }
.sky__beam--2 { transform: rotate(45deg); opacity: 0.7; }
.sky__beam--3 { transform: rotate(75deg); opacity: 0.5; }

/* Horizon silhouette */
.sky__horizon {
  position: absolute;
  left: -2%;
  right: -2%;
  bottom: 0;
  height: 35%;
  pointer-events: none;
  will-change: transform;
}
.sky__horizon svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Viewer */
.sky__viewer {
  position: absolute;
  bottom: 4%;
  left: 50%;
  width: 80px;
  height: 100px;
  margin-left: -40px;
  pointer-events: none;
  will-change: transform;
}
.sky__viewer svg {
  width: 100%;
  height: 100%;
  display: block;
}

@media (max-width: 640px) {
  .sky__sun-wrap { width: 120px; height: 120px; top: 14%; right: 8%; }
  .sky__beams { width: 360px; height: 360px; right: 12%; }
}
</style>
