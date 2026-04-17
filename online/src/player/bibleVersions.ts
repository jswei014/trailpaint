/**
 * Bible version IDs for bible.com (YouVersion) deep links.
 * Verified 2026-04-17 via WebFetch — see 009 Task 1.
 * - 46  = CUNP-神 (Chinese Union New Punctuation, 繁體中文和合本)
 * - 111 = NIV (English)
 * ja locale falls back to NIV until Japanese content ships; add JCB (81) then.
 */

export const BIBLE_VERSIONS: Record<string, number> = {
  'zh-TW': 46,
  'en': 111,
  'ja': 111,
};

export const DEFAULT_BIBLE_VERSION = 111;

export function getBibleVersion(locale: string): number {
  return BIBLE_VERSIONS[locale] ?? DEFAULT_BIBLE_VERSION;
}
