/**
 * Parse scripture reference strings like "Matt 26:36-46", "太 26:36", "Ps 23".
 *
 * Per 009 D3 parser scope:
 *   ✅ Single verse:    "Matt 26:36"
 *   ✅ Verse range:     "Matt 26:36-46"
 *   ✅ Whole chapter:   "Ps 23"
 *   ❌ Cross-chapter:   "Matt 26:36-27:5"  → null (fallback to plain text)
 *   ❌ Non-contiguous:  "Matt 26:36,38,41" → null
 *   ❌ Multi-book:      "Matt 26 / Mark 14" → null (caller should split into array)
 */

import { lookupBook } from './bibleBooks';

export interface ParsedRef {
  book: string; // USFM 3-letter code
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

// Matches:
//   <book> <ch>                    (whole chapter, e.g. "Ps 23")
//   <book> <ch>:<v>                (single verse, e.g. "Matt 26:36")
//   <book> <ch>:<vs>-<ve>          (verse range, e.g. "Matt 26:36-46")
// Book can include spaces + digits (e.g. "1 John", "1John") and Chinese chars.
// Explicitly rejects cross-chapter / non-contiguous via character class.
const REF_RE = /^\s*(?<book>[1-3]?\s?[A-Za-z\u4e00-\u9fff一二三]+)\s*(?<ch>\d+)(?::(?<vs>\d+)(?:-(?<ve>\d+))?)?\s*$/;

export function parseRef(ref: string): ParsedRef | null {
  if (typeof ref !== 'string' || ref.length === 0 || ref.length > 50) return null;

  // Quick reject for unsupported patterns
  if (ref.includes(',')) return null; // non-contiguous verses
  // Cross-chapter: "26:36-27:5" contains a ':' in the range portion after the '-'
  const dashIdx = ref.indexOf('-');
  if (dashIdx !== -1 && ref.indexOf(':', dashIdx) !== -1) return null;

  const m = REF_RE.exec(ref);
  if (!m || !m.groups) return null;

  const bookCode = lookupBook(m.groups.book);
  if (!bookCode) return null;

  const chapter = parseInt(m.groups.ch, 10);
  if (!Number.isFinite(chapter) || chapter < 1 || chapter > 150) return null;

  if (!m.groups.vs) {
    return { book: bookCode, chapter };
  }
  const verseStart = parseInt(m.groups.vs, 10);
  if (!Number.isFinite(verseStart) || verseStart < 1 || verseStart > 200) return null;

  if (!m.groups.ve) {
    return { book: bookCode, chapter, verseStart };
  }
  const verseEnd = parseInt(m.groups.ve, 10);
  if (!Number.isFinite(verseEnd) || verseEnd < verseStart || verseEnd > 200) return null;

  return { book: bookCode, chapter, verseStart, verseEnd };
}
