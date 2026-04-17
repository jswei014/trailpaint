/**
 * Build bible.com (YouVersion) deep link from a parsed scripture reference.
 *
 * Per 009 D3/D7 attack surface:
 *   - book code MUST come from lookupBook() whitelist (USFM 3-letter)
 *   - versionId MUST come from BIBLE_VERSIONS whitelist (integer)
 *   - URL is constructed from primitive values only; no user-supplied strings interpolated
 */

import type { ParsedRef } from './scriptureParser';
import { getBibleVersion } from './bibleVersions';
import { BIBLE_BOOKS } from './bibleBooks';

const VALID_CODES = new Set(BIBLE_BOOKS.map((b) => b.code));

/**
 * Construct a bible.com URL for a parsed reference.
 * Returns null if the parsed ref has an unknown book code (should be caught earlier,
 * but this is the last-line defense against unvalidated input).
 */
export function buildBibleUrl(parsed: ParsedRef, locale: string): string | null {
  if (!parsed || typeof parsed.book !== 'string') return null;
  if (!VALID_CODES.has(parsed.book)) return null;
  if (!Number.isInteger(parsed.chapter) || parsed.chapter < 1) return null;

  const versionId = getBibleVersion(locale);
  if (!Number.isInteger(versionId) || versionId < 1) return null;

  const base = `https://www.bible.com/bible/${versionId}/${parsed.book}.${parsed.chapter}`;
  if (typeof parsed.verseStart === 'number' && Number.isInteger(parsed.verseStart) && parsed.verseStart >= 1) {
    return `${base}.${parsed.verseStart}`;
  }
  return base;
}
