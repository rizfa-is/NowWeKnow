/**
 * Shared types for the worksheet runtime.
 */

export type Locale = 'en' | 'id'
export type AgeBand = 'paud' | 'sd-low' | 'sd-high'
export type WorksheetType = 'color' | 'sequence' | 'move' | 'maze' | 'loop'

export interface LocalizedString {
  en: string
  id: string
}

/**
 * Common worksheet metadata stored in markdown frontmatter.
 * The `data` field is type-specific and validated by each worksheet component.
 */
export interface WorksheetMeta {
  path: string
  title: LocalizedString
  type: WorksheetType
  ageBand: AgeBand
  concept: string
  order: number
  locales: Locale[]
  accent?: string
  data: Record<string, unknown>
}

/**
 * Result of a single voice recognition attempt.
 */
export interface VoiceResult {
  transcript: string
  confidence: number
  matched: string | null
  attempts: number
}

/**
 * Mapping from a normalized "answer key" to all phrases that should match it
 * across locales. Used by `matchPhrase` and worksheet components.
 */
export interface PhraseDictionary {
  // key -> { en: ['red', 'reddish'], id: ['merah'] }
  [key: string]: Partial<Record<Locale, string[]>>
}

/**
 * Outcome of a worksheet step. Worksheets emit these so the shell can
 * render uniform feedback (chime, hint, progress dot fill).
 */
export type StepOutcome = 'correct' | 'wrong' | 'skipped'
