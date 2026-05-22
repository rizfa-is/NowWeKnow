import { useSpeechRecognition } from '@vueuse/core'
import type { Locale, PhraseDictionary } from '~/types/worksheet'
import { speechLocaleFor } from './useLocale'

interface UseVoiceOptions {
  /** Continuous listening keeps the mic on after a result. */
  continuous?: boolean
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
 *
 * Each transcript word is compared against every phrase in the dictionary.
 * A match wins on exact normalized equality OR substring containment in
 * either direction (so "i think it's red" still matches "red").
 */
export function matchPhrase(
  transcript: string,
  dict: PhraseDictionary,
  locale: Locale,
): string | null {
  if (!transcript) return null
  const heard = normalize(transcript)
  if (!heard) return null
  const heardWords = heard.split(' ')

  const tryLocale = (loc: Locale): string | null => {
    for (const [key, byLocale] of Object.entries(dict)) {
      const phrases = byLocale[loc] ?? []
      for (const phrase of phrases) {
        const norm = normalize(phrase)
        if (!norm) continue
        if (heard === norm) return key
        if (heard.includes(norm) || norm.includes(heard)) return key
        // Word-level match (handles "merah." or "the merah" cases)
        if (heardWords.includes(norm)) return key
      }
    }
    return null
  }

  // Try the active locale first, then fall back to the other locale so
  // a kid speaking the wrong language still gets credit.
  return tryLocale(locale) ?? tryLocale(locale === 'en' ? 'id' : 'en')
}

/**
 * Voice input wrapper around VueUse's `useSpeechRecognition`.
 *
 * - locale-aware language tag (id-ID / en-US) that follows useLocale()
 * - per-prompt listen/stop with attempt counting
 * - normalized matching against a phrase dictionary (case + diacritic insensitive)
 * - `resultCount` ref that worksheets watch to react to any new transcript,
 *   sidestepping browser-specific quirks with the `isFinal` flag
 * - graceful fallback signal when the API is unsupported or denied
 */
export function useVoice(options: UseVoiceOptions = {}) {
  const {
    continuous = false,
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
  const fallbackToTouch = ref(false)
  /**
   * Bumps every time a final transcript is received.
   * Worksheets watch this to evaluate, regardless of how a particular
   * browser flips `isFinal` between interim and final events.
   */
  const resultCount = ref(0)

  // VueUse's `result` ref holds the latest transcript. With interimResults
  // off, every emission is final — so any change to the ref means a new
  // utterance has been recognized.
  if (import.meta.client) {
    watch(speech.result, (transcript) => {
      if (typeof transcript === 'string' && transcript.length > 0) {
        resultCount.value += 1
      }
    })
  }

  function listen() {
    if (!speech.isSupported.value) {
      fallbackToTouch.value = true
      return
    }
    speech.start()
  }

  function reset() {
    attempts.value = 0
    fallbackToTouch.value = false
  }

  /**
   * Evaluate the latest transcript against a phrase dictionary.
   * Increments attempts and trips the touch fallback flag on failure.
   *
   * The dictionary itself is the whitelist: only known answer words
   * resolve to a match, so we don't need a separate confidence gate.
   */
  function evaluate(dict: PhraseDictionary) {
    const transcript = speech.result.value || ''
    const matched = matchPhrase(transcript, dict, locale.value)
    const success = Boolean(matched)

    if (!success) {
      attempts.value += 1
      if (attempts.value >= maxAttempts) fallbackToTouch.value = true
    }

    return {
      transcript,
      matched: success ? matched : null,
      attempts: attempts.value,
    }
  }

  return {
    // state
    isSupported: speech.isSupported,
    isListening: speech.isListening,
    isFinal: speech.isFinal,
    transcript: speech.result,
    resultCount,
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
