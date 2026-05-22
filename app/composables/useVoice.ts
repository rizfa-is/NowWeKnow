import { useSpeechRecognition } from '@vueuse/core'
import type { Locale, PhraseDictionary } from '~/types/worksheet'
import { speechLocaleFor } from './useLocale'

interface UseVoiceOptions {
  /** Continuous listening keeps the mic on after a result. */
  continuous?: boolean
  /** Confidence threshold below which a result is treated as unclear. */
  minConfidence?: number
  /** Misrecognitions tolerated before signaling fall-back to touch. */
  maxAttempts?: number
}

/**
 * Normalize a phrase for fuzzy comparison.
 * Lowercases, strips diacritics + punctuation, collapses whitespace.
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Match a transcript against a phrase dictionary.
 * Returns the matching key, or null when nothing matched.
 */
export function matchPhrase(
  transcript: string,
  dict: PhraseDictionary,
  locale: Locale,
): string | null {
  if (!transcript) return null
  const heard = normalize(transcript)
  if (!heard) return null

  const tryLocale = (loc: Locale): string | null => {
    for (const [key, byLocale] of Object.entries(dict)) {
      const phrases = byLocale[loc] ?? []
      for (const phrase of phrases) {
        const norm = normalize(phrase)
        if (!norm) continue
        if (heard === norm || heard.includes(norm) || norm.includes(heard)) {
          return key
        }
      }
    }
    return null
  }

  return tryLocale(locale) ?? tryLocale(locale === 'en' ? 'id' : 'en')
}

/**
 * Voice input wrapper around VueUse's `useSpeechRecognition`.
 *
 * Provides:
 *  - locale-aware language tag (id-ID / en-US)
 *  - per-prompt listen/stop with attempt counting
 *  - confidence reading from the underlying SpeechRecognition events
 *  - normalized matching against a phrase dictionary
 *  - graceful fallback signal when the API is unsupported or denied
 */
export function useVoice(options: UseVoiceOptions = {}) {
  const {
    continuous = false,
    minConfidence = 0.6,
    maxAttempts = 2,
  } = options

  const locale = useLocale()
  const lang = computed(() => speechLocaleFor(locale.value))

  const speech = useSpeechRecognition({
    lang,
    continuous,
    interimResults: false,
    maxAlternatives: 1,
  })

  const attempts = ref(0)
  const lastTranscript = ref('')
  const lastConfidence = ref(0)
  const fallbackToTouch = ref(false)

  // Capture confidence directly from the SpeechRecognition `result` event,
  // since VueUse only exposes the transcript string. The DOM SpeechRecognition
  // types are still vendor-specific in some browsers, so we cast through any.
  if (import.meta.client) {
    const attachListener = () => {
      const rec = speech.recognition as unknown as EventTarget | undefined
      if (!rec) return
      rec.addEventListener('result', (event: Event) => {
        const e = event as Event & {
          results: ArrayLike<ArrayLike<{ transcript: string, confidence: number }>>
        }
        const last = e.results[e.results.length - 1]
        if (!last) return
        const alt = last[0]
        if (!alt) return
        lastTranscript.value = alt.transcript
        lastConfidence.value = alt.confidence ?? 0
      })
    }
    onMounted(attachListener)
    // VueUse re-creates `recognition` when `lang` changes (via watch).
    watch(lang, () => nextTick(attachListener))
  }

  function listen() {
    if (!speech.isSupported.value) {
      fallbackToTouch.value = true
      return
    }
    lastTranscript.value = ''
    lastConfidence.value = 0
    speech.start()
  }

  function reset() {
    attempts.value = 0
    fallbackToTouch.value = false
    lastTranscript.value = ''
    lastConfidence.value = 0
  }

  /**
   * Evaluate the latest transcript against a phrase dictionary.
   * Increments attempts and trips the touch fallback flag on failure.
   */
  function evaluate(dict: PhraseDictionary) {
    const matched = matchPhrase(lastTranscript.value, dict, locale.value)
    // When the browser doesn't report confidence, trust a phrase hit.
    const confident = lastConfidence.value === 0
      ? Boolean(matched)
      : lastConfidence.value >= minConfidence
    const success = Boolean(matched) && confident

    if (!success) {
      attempts.value += 1
      if (attempts.value >= maxAttempts) fallbackToTouch.value = true
    }

    return {
      transcript: lastTranscript.value,
      confidence: lastConfidence.value,
      matched: success ? matched : null,
      attempts: attempts.value,
    }
  }

  return {
    // state
    isSupported: speech.isSupported,
    isListening: speech.isListening,
    isFinal: speech.isFinal,
    transcript: lastTranscript,
    confidence: lastConfidence,
    attempts,
    fallbackToTouch,
    error: speech.error,
    locale,
    lang,
    // actions
    listen,
    stop: speech.stop,
    reset,
    evaluate,
    matchPhrase: (t: string, d: PhraseDictionary) => matchPhrase(t, d, locale.value),
  }
}
