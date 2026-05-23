import { useSpeechRecognition } from '@vueuse/core'
import type { Locale, PhraseDictionary } from '~/types/worksheet'
import { speechLocaleFor } from './useLocale'

interface UseVoiceOptions {
  /** Continuous listening keeps the mic on after a result. */
  continuous?: boolean
  /** Misrecognitions tolerated before signaling fall-back to touch. */
  maxAttempts?: number
  /** How many alternative transcripts to ask for per utterance. */
  maxAlternatives?: number
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
 * Matching layers (most strict to most permissive):
 *   1. Exact normalized equality
 *   2. Substring containment in either direction (handles "i think red")
 *   3. Word-level membership (handles trailing punctuation, particles)
 *   4. Locale fallback (try the other locale if active locale failed)
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
        if (heardWords.includes(norm)) return key
        // Multi-word phrase fully contained as a sequence in the words
        if (norm.includes(' ')) {
          const phraseWords = norm.split(' ')
          for (let i = 0; i <= heardWords.length - phraseWords.length; i++) {
            if (phraseWords.every((w, j) => heardWords[i + j] === w)) return key
          }
        }
      }
    }
    return null
  }

  return tryLocale(locale) ?? tryLocale(locale === 'en' ? 'id' : 'en')
}

/**
 * Match across multiple candidate transcripts. Useful when the SpeechRecognition
 * API returns alternatives; we accept the first candidate that resolves.
 */
export function matchPhraseAny(
  transcripts: string[],
  dict: PhraseDictionary,
  locale: Locale,
): { matched: string | null, transcript: string } {
  for (const t of transcripts) {
    const m = matchPhrase(t, dict, locale)
    if (m) return { matched: m, transcript: t }
  }
  return { matched: null, transcript: transcripts[0] ?? '' }
}

/**
 * Voice input wrapper around VueUse's `useSpeechRecognition`.
 *
 * - locale-aware language tag (id-ID / en-US) that follows useLocale()
 * - per-prompt listen/stop with attempt counting
 * - normalized matching against a phrase dictionary (case + diacritic insensitive)
 * - alternatives: collects up to `maxAlternatives` candidate transcripts and
 *   matches across all of them, dramatically improving recognition for kids
 * - resultCount ref bumps when any new transcript arrives
 * - graceful fallback signal when the API is unsupported or denied
 */
export function useVoice(options: UseVoiceOptions = {}) {
  const {
    continuous = false,
    maxAttempts = 2,
    maxAlternatives = 3,
  } = options

  const locale = useLocale()
  const lang = computed(() => speechLocaleFor(locale.value))

  const speech = useSpeechRecognition({
    lang,
    continuous,
    interimResults: false,
    maxAlternatives,
  })

  const attempts = ref(0)
  const fallbackToTouch = ref(false)
  const resultCount = ref(0)
  /**
   * Latest list of candidate transcripts returned by the recognizer.
   * Filled by the dedicated event listener below since VueUse only
   * exposes the top transcript via its `result` ref.
   */
  const candidates = ref<string[]>([])

  if (import.meta.client) {
    const attachListener = () => {
      const rec = speech.recognition as unknown as EventTarget | undefined
      if (!rec) return
      rec.addEventListener('result', (event: Event) => {
        const e = event as Event & {
          results: ArrayLike<{
            length: number
            isFinal: boolean
            [index: number]: { transcript: string }
          }>
          resultIndex: number
        }
        const last = e.results[e.results.length - 1]
        if (!last) return
        const list: string[] = []
        for (let i = 0; i < last.length; i++) {
          const alt = last[i]
          if (alt && typeof alt.transcript === 'string') list.push(alt.transcript)
        }
        if (list.length > 0) {
          candidates.value = list
          resultCount.value += 1
        }
      })
    }
    onMounted(attachListener)
    watch(lang, () => nextTick(attachListener))
  }

  function listen() {
    if (!speech.isSupported.value) {
      fallbackToTouch.value = true
      return
    }
    candidates.value = []
    speech.start()
  }

  function reset() {
    attempts.value = 0
    fallbackToTouch.value = false
    candidates.value = []
  }

  /**
   * Evaluate the latest utterance against a phrase dictionary.
   * Considers all alternatives the recognizer returned, so a kid's
   * "merah" stays accepted even if the top guess was "marah".
   */
  function evaluate(dict: PhraseDictionary) {
    const list = candidates.value.length > 0
      ? candidates.value
      : [speech.result.value || '']
    const { matched, transcript } = matchPhraseAny(list, dict, locale.value)
    const success = Boolean(matched)

    if (!success) {
      attempts.value += 1
      if (attempts.value >= maxAttempts) fallbackToTouch.value = true
    }

    return {
      transcript,
      candidates: list,
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
    candidates,
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
