import type { Locale } from '~/types/worksheet'

/**
 * Active UI + voice locale, persisted across navigation.
 *
 * `useState` keeps it SSR-safe and reactive everywhere.
 */
export function useLocale() {
  return useState<Locale>('app-locale', () => 'en')
}

/**
 * Map app locale to the BCP-47 tag that the Web Speech API expects.
 */
export function speechLocaleFor(locale: Locale): string {
  return locale === 'id' ? 'id-ID' : 'en-US'
}

/**
 * Pick the localized string from a `{ en, id }` object.
 */
export function pick<T>(value: { en: T, id: T } | T, locale: Locale): T {
  if (value && typeof value === 'object' && 'en' in (value as object) && 'id' in (value as object)) {
    return (value as { en: T, id: T })[locale]
  }
  return value as T
}
