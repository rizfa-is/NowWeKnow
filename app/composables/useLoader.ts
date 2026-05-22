/**
 * Simulates an asset preloader. In a real app you'd hook this to image
 * preloading, font loading, or first-paint signals. For now we use a
 * timed ramp so the loader feels deliberate, like Persepolis Reimagined.
 */
export function useLoader() {
  const progress = useState('loader-progress', () => 0)
  const ready = useState('loader-ready', () => false)

  if (import.meta.client) {
    onMounted(() => {
      // Skip if already finished (e.g. client navigation)
      if (ready.value) return

      const start = performance.now()
      const duration = 2200 // ms

      const tick = (now: number) => {
        const elapsed = now - start
        const t = Math.min(elapsed / duration, 1)
        // ease-out cubic
        progress.value = Math.round((1 - Math.pow(1 - t, 3)) * 100)

        if (t < 1) {
          requestAnimationFrame(tick)
        } else {
          progress.value = 100
          // tiny pause at 100 so the user sees it land
          setTimeout(() => {
            ready.value = true
          }, 350)
        }
      }
      requestAnimationFrame(tick)
    })
  }

  return { progress, ready }
}
