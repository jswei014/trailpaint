/**
 * Smoke tests for Bible deep-link modules (009 Task 4 D6 manual smoke, automated).
 *
 * Per D6: these modules (scriptureParser / bibleBooks / bibleUrl) are "manual smoke"
 * rather than formal unit tests. This file automates the smoke list from tasks.md
 * T4 step 6 so results are recorded and reproducible. Kept intentionally small.
 */
import { describe, it, expect } from 'vitest';
import { parseRef } from './scriptureParser';
import { lookupBook } from './bibleBooks';
import { buildBibleUrl } from './bibleUrl';

describe('scriptureParser smoke', () => {
  it('parses single verse (English)', () => {
    expect(parseRef('Matt 26:36')).toEqual({ book: 'MAT', chapter: 26, verseStart: 36 });
  });
  it('parses verse range (English)', () => {
    expect(parseRef('Matt 26:36-46')).toEqual({ book: 'MAT', chapter: 26, verseStart: 36, verseEnd: 46 });
  });
  it('parses single verse (Chinese)', () => {
    expect(parseRef('太 26:36')).toEqual({ book: 'MAT', chapter: 26, verseStart: 36 });
  });
  it('parses whole chapter (English Psalm)', () => {
    expect(parseRef('Ps 23')).toEqual({ book: 'PSA', chapter: 23 });
  });
  it('parses single verse with Chinese John', () => {
    expect(parseRef('約 3:16')).toEqual({ book: 'JHN', chapter: 3, verseStart: 16 });
  });
  it('parses numbered book 1 John', () => {
    expect(parseRef('1 John 3:16')).toEqual({ book: '1JN', chapter: 3, verseStart: 16 });
  });
  it('parses numbered book 約一', () => {
    expect(parseRef('約一 3:16')).toEqual({ book: '1JN', chapter: 3, verseStart: 16 });
  });
  it('rejects cross-chapter reference', () => {
    expect(parseRef('Matt 26:36-27:5')).toBeNull();
  });
  it('rejects non-contiguous verses', () => {
    expect(parseRef('Matt 26:36,38')).toBeNull();
  });
  it('rejects garbage input', () => {
    expect(parseRef('隨便亂打')).toBeNull();
  });
});

describe('bibleBooks smoke', () => {
  it('looks up Matt → MAT', () => { expect(lookupBook('Matt')).toBe('MAT'); });
  it('looks up 太 → MAT', () => { expect(lookupBook('太')).toBe('MAT'); });
  it('looks up 啟 → REV', () => { expect(lookupBook('啟')).toBe('REV'); });
  it('looks up Rev → REV', () => { expect(lookupBook('Rev')).toBe('REV'); });
  it('returns null for unknown alias', () => { expect(lookupBook('xxx')).toBeNull(); });
  it('looks up 約一 → 1JN', () => { expect(lookupBook('約一')).toBe('1JN'); });
});

describe('bibleUrl smoke', () => {
  it('rejects non-whitelist book code (XSS defense)', () => {
    expect(buildBibleUrl({ book: 'javascript:alert', chapter: 1 }, 'en')).toBeNull();
  });
  it('builds URL for zh-TW (CUNP version 46)', () => {
    const parsed = parseRef('太 26:36')!;
    expect(buildBibleUrl(parsed, 'zh-TW')).toBe('https://www.bible.com/bible/46/MAT.26.36');
  });
  it('builds URL for en (NIV version 111)', () => {
    const parsed = parseRef('Matt 26:36')!;
    expect(buildBibleUrl(parsed, 'en')).toBe('https://www.bible.com/bible/111/MAT.26.36');
  });
  it('builds whole-chapter URL when no verse', () => {
    const parsed = parseRef('Ps 23')!;
    expect(buildBibleUrl(parsed, 'en')).toBe('https://www.bible.com/bible/111/PSA.23');
  });
  it('rejects invalid chapter', () => {
    expect(buildBibleUrl({ book: 'MAT', chapter: 0 }, 'en')).toBeNull();
  });
});
