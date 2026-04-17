/**
 * Bible book alias map (66 books).
 * Each book has multiple aliases (English full/abbr, Chinese full/abbr, numbered variants).
 * Code is USFM 3-letter used by bible.com URL paths (e.g. MAT.26.36).
 *
 * Per 009 D3/S3: 66 × 2 primary aliases (en + zh), plus common numbered-book variants.
 */

interface BookEntry {
  code: string;
  aliases: string[]; // English aliases stored lowercased; Chinese aliases as-is
}

export const BIBLE_BOOKS: BookEntry[] = [
  // Old Testament
  { code: 'GEN', aliases: ['gen', 'genesis', '創', '創世記'] },
  { code: 'EXO', aliases: ['exo', 'exod', 'exodus', '出', '出埃及記'] },
  { code: 'LEV', aliases: ['lev', 'leviticus', '利', '利未記'] },
  { code: 'NUM', aliases: ['num', 'numbers', '民', '民數記'] },
  { code: 'DEU', aliases: ['deu', 'deut', 'deuteronomy', '申', '申命記'] },
  { code: 'JOS', aliases: ['jos', 'josh', 'joshua', '書', '約書亞記'] },
  { code: 'JDG', aliases: ['jdg', 'judg', 'judges', '士', '士師記'] },
  { code: 'RUT', aliases: ['rut', 'ruth', '得', '路得記'] },
  { code: '1SA', aliases: ['1sa', '1sam', '1 sam', '1 samuel', '1samuel', '撒上', '撒母耳記上', '1撒'] },
  { code: '2SA', aliases: ['2sa', '2sam', '2 sam', '2 samuel', '2samuel', '撒下', '撒母耳記下', '2撒'] },
  { code: '1KI', aliases: ['1ki', '1kgs', '1 kgs', '1 kings', '1kings', '王上', '列王紀上', '1王'] },
  { code: '2KI', aliases: ['2ki', '2kgs', '2 kgs', '2 kings', '2kings', '王下', '列王紀下', '2王'] },
  { code: '1CH', aliases: ['1ch', '1chr', '1 chr', '1 chronicles', '1chronicles', '代上', '歷代志上', '1代'] },
  { code: '2CH', aliases: ['2ch', '2chr', '2 chr', '2 chronicles', '2chronicles', '代下', '歷代志下', '2代'] },
  { code: 'EZR', aliases: ['ezr', 'ezra', '拉', '以斯拉記'] },
  { code: 'NEH', aliases: ['neh', 'nehemiah', '尼', '尼希米記'] },
  { code: 'EST', aliases: ['est', 'esth', 'esther', '斯', '以斯帖記'] },
  { code: 'JOB', aliases: ['job', '伯', '約伯記'] },
  { code: 'PSA', aliases: ['ps', 'psa', 'psalm', 'psalms', '詩', '詩篇'] },
  { code: 'PRO', aliases: ['pro', 'prov', 'proverbs', '箴', '箴言'] },
  { code: 'ECC', aliases: ['ecc', 'eccl', 'ecclesiastes', '傳', '傳道書'] },
  { code: 'SNG', aliases: ['sng', 'song', 'song of solomon', 'song of songs', '歌', '雅歌'] },
  { code: 'ISA', aliases: ['isa', 'isaiah', '賽', '以賽亞書'] },
  { code: 'JER', aliases: ['jer', 'jeremiah', '耶', '耶利米書'] },
  { code: 'LAM', aliases: ['lam', 'lamentations', '哀', '耶利米哀歌'] },
  { code: 'EZK', aliases: ['ezk', 'ezek', 'ezekiel', '結', '以西結書'] },
  { code: 'DAN', aliases: ['dan', 'daniel', '但', '但以理書'] },
  { code: 'HOS', aliases: ['hos', 'hosea', '何', '何西阿書'] },
  { code: 'JOL', aliases: ['jol', 'joel', '珥', '約珥書'] },
  { code: 'AMO', aliases: ['amo', 'amos', '摩', '阿摩司書'] },
  { code: 'OBA', aliases: ['oba', 'obad', 'obadiah', '俄', '俄巴底亞書'] },
  { code: 'JON', aliases: ['jon', 'jonah', '拿', '約拿書'] },
  { code: 'MIC', aliases: ['mic', 'micah', '彌', '彌迦書'] },
  { code: 'NAM', aliases: ['nam', 'nah', 'nahum', '鴻', '那鴻書'] },
  { code: 'HAB', aliases: ['hab', 'habakkuk', '哈', '哈巴谷書'] },
  { code: 'ZEP', aliases: ['zep', 'zeph', 'zephaniah', '番', '西番雅書'] },
  { code: 'HAG', aliases: ['hag', 'haggai', '該', '哈該書'] },
  { code: 'ZEC', aliases: ['zec', 'zech', 'zechariah', '亞', '撒迦利亞書'] },
  { code: 'MAL', aliases: ['mal', 'malachi', '瑪', '瑪拉基書'] },
  // New Testament
  { code: 'MAT', aliases: ['mat', 'matt', 'matthew', '太', '馬太福音'] },
  { code: 'MRK', aliases: ['mrk', 'mk', 'mark', '可', '馬可福音'] },
  { code: 'LUK', aliases: ['luk', 'lk', 'luke', '路', '路加福音'] },
  { code: 'JHN', aliases: ['jhn', 'jn', 'john', '約', '約翰福音'] },
  { code: 'ACT', aliases: ['act', 'acts', '徒', '使徒行傳'] },
  { code: 'ROM', aliases: ['rom', 'romans', '羅', '羅馬書'] },
  { code: '1CO', aliases: ['1co', '1cor', '1 cor', '1 corinthians', '1corinthians', '林前', '哥林多前書', '1林'] },
  { code: '2CO', aliases: ['2co', '2cor', '2 cor', '2 corinthians', '2corinthians', '林後', '哥林多後書', '2林'] },
  { code: 'GAL', aliases: ['gal', 'galatians', '加', '加拉太書'] },
  { code: 'EPH', aliases: ['eph', 'ephesians', '弗', '以弗所書'] },
  { code: 'PHP', aliases: ['php', 'phil', 'philippians', '腓', '腓立比書'] },
  { code: 'COL', aliases: ['col', 'colossians', '西', '歌羅西書'] },
  { code: '1TH', aliases: ['1th', '1thess', '1 thess', '1 thessalonians', '1thessalonians', '帖前', '帖撒羅尼迦前書', '1帖'] },
  { code: '2TH', aliases: ['2th', '2thess', '2 thess', '2 thessalonians', '2thessalonians', '帖後', '帖撒羅尼迦後書', '2帖'] },
  { code: '1TI', aliases: ['1ti', '1tim', '1 tim', '1 timothy', '1timothy', '提前', '提摩太前書', '1提'] },
  { code: '2TI', aliases: ['2ti', '2tim', '2 tim', '2 timothy', '2timothy', '提後', '提摩太後書', '2提'] },
  { code: 'TIT', aliases: ['tit', 'titus', '多', '提多書'] },
  { code: 'PHM', aliases: ['phm', 'philem', 'philemon', '門', '腓利門書'] },
  { code: 'HEB', aliases: ['heb', 'hebrews', '來', '希伯來書'] },
  { code: 'JAS', aliases: ['jas', 'jam', 'james', '雅', '雅各書'] },
  { code: '1PE', aliases: ['1pe', '1pet', '1 pet', '1 peter', '1peter', '彼前', '彼得前書', '1彼'] },
  { code: '2PE', aliases: ['2pe', '2pet', '2 pet', '2 peter', '2peter', '彼後', '彼得後書', '2彼'] },
  { code: '1JN', aliases: ['1jn', '1jo', '1jn', '1 john', '1john', '約一', '1約', '一約', '約翰一書'] },
  { code: '2JN', aliases: ['2jn', '2jo', '2 john', '2john', '約二', '2約', '二約', '約翰二書'] },
  { code: '3JN', aliases: ['3jn', '3jo', '3 john', '3john', '約三', '3約', '三約', '約翰三書'] },
  { code: 'JUD', aliases: ['jud', 'jude', '猶', '猶大書'] },
  { code: 'REV', aliases: ['rev', 'revelation', '啟', '啟示錄'] },
];

const BOOK_LOOKUP = new Map<string, string>();
for (const b of BIBLE_BOOKS) {
  for (const alias of b.aliases) {
    BOOK_LOOKUP.set(alias.toLowerCase(), b.code);
  }
}

/**
 * Look up a USFM book code from an alias.
 * Accepts English (case-insensitive, with/without spaces) and Chinese aliases.
 * Returns null if no match.
 */
export function lookupBook(alias: string): string | null {
  if (typeof alias !== 'string' || alias.length === 0) return null;
  const normalized = alias.trim().toLowerCase().replace(/\s+/g, ' ');
  return BOOK_LOOKUP.get(normalized) ?? null;
}
