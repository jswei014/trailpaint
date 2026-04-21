#!/usr/bin/env node
/**
 * Build 5 new story groups from /tmp/trailpaint-stories/*.json:
 *   zhang-qian, wen-tianxiang, marco-polo, xu-xiake, jesus-galilee
 *
 * Per story:
 *   - Download cover + each spot photo from Wikimedia (Special:FilePath auto-redirect)
 *   - Produce cover.jpg (800px), og.jpg (1200x628 center crop), {seg}-thumb.jpg (400px)
 *   - Produce {seg}.trailpaint.json (v4, photo inlined as base64)
 *   - Produce story.json (drops cover_candidate, adds stories[] pointing to segments)
 *   - Produce CREDITS.md
 * Catalog update + index.html generation handled by subsequent scripts.
 *
 *   Run: node online/scripts/build-new-5-stories.mjs
 */
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const STORIES_DIR = join(ROOT, 'stories');
const SRC_JSON_DIR = '/tmp/trailpaint-stories';
const TMP = '/tmp/tp-new-5-stories';
const UA = 'TrailPaint-example-builder/1.0 (https://trailpaint.org; https://github.com/notoriouslab/trailpaint) curl';
await mkdir(TMP, { recursive: true });

const SLUG_TO_COLLECTION = {
  'zhang-qian': 'china',
  'wen-tianxiang': 'china',
  'marco-polo': 'exploration',
  'xu-xiake': 'china',
  'jesus-galilee': 'bible',
};

const SLUG_TO_MUSIC = {
  'zhang-qian': { src: '../music/voller-hoffnung.mp3', title: 'Voller Hoffnung — Ronny Matthes', credit: 'Ronny Matthes (Jamendo / Internet Archive)', license: 'CC' },
  'wen-tianxiang': { src: '../music/sorrow-and-love.mp3', title: 'Sorrow and Love — Ronny Matthes', credit: 'Ronny Matthes (Jamendo / Internet Archive)', license: 'CC' },
  'marco-polo': { src: '../music/voller-hoffnung.mp3', title: 'Voller Hoffnung — Ronny Matthes', credit: 'Ronny Matthes (Jamendo / Internet Archive)', license: 'CC' },
  'xu-xiake': { src: '../music/voller-hoffnung.mp3', title: 'Voller Hoffnung — Ronny Matthes', credit: 'Ronny Matthes (Jamendo / Internet Archive)', license: 'CC' },
  'jesus-galilee': { src: '../music/sorrow-and-love.mp3', title: 'Sorrow and Love — Ronny Matthes', credit: 'Ronny Matthes (Jamendo / Internet Archive)', license: 'CC' },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function runSips(args) {
  return new Promise((resolve, reject) => {
    const p = spawn('sips', args, { stdio: ['ignore', 'ignore', 'inherit'] });
    p.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`sips ${c}`))));
  });
}

function curlDownload(url, dest) {
  return new Promise((resolve) => {
    const p = spawn('curl', ['-sSL', '--max-time', '60', '-A', UA, '-o', dest, '-w', '%{http_code}', url], {
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    let code = '';
    p.stdout.on('data', (d) => (code += d.toString()));
    p.on('close', (x) => resolve(x !== 0 ? `curl_${x}` : code.trim()));
  });
}

const FAILED = [];
async function fetchWithRetry(url, dest) {
  const backoffs = [10000, 30000, 60000];
  for (let attempt = 0; attempt <= backoffs.length; attempt++) {
    const code = await curlDownload(url, dest);
    if (code.startsWith('2')) return 'ok';
    if (code === '404') return '404';
    if ((code === '429' || code.startsWith('5') || code.startsWith('curl_')) && attempt < backoffs.length) {
      process.stdout.write(`[${code},wait ${backoffs[attempt] / 1000}s] `);
      await sleep(backoffs[attempt]);
      continue;
    }
    return `fail_${code}`;
  }
  return 'exhausted';
}

// Wikimedia Special:FilePath resolves any filename to current CDN URL.
function fpUrl(filename) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

async function downloadRaw(id, filename) {
  const raw = join(TMP, `${id}.raw`);
  if (existsSync(raw)) return raw;
  process.stdout.write(`    ${id}... `);
  const r = await fetchWithRetry(fpUrl(filename), raw);
  if (r !== 'ok') {
    process.stdout.write(`[${r}] SKIP\n`);
    FAILED.push({ id, filename, r });
    return null;
  }
  process.stdout.write('ok\n');
  await sleep(2500); // Wikimedia rate limit politeness
  return raw;
}

async function makeSpotPhoto(id, raw) {
  // 400px long-edge, quality 60 — matches passion-week Round 4 baseline
  const out = join(TMP, `${id}-spot.jpg`);
  if (!existsSync(out)) {
    await runSips(['-Z', '400', '-s', 'format', 'jpeg', '-s', 'formatOptions', '60', raw, '--out', out]);
  }
  const jpg = await readFile(out);
  return `data:image/jpeg;base64,${jpg.toString('base64')}`;
}

async function makeCoverJpg(id, raw, destCover, destOg) {
  // cover.jpg: 800px long-edge q82
  await runSips(['-Z', '800', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', raw, '--out', destCover]);
  // og.jpg: 1200x628 center crop q82 — for FB/Twitter 1.91:1
  // sips can't center-crop directly; use --resampleHeightWidthMax then --cropToHeightWidth
  await runSips(['-Z', '1400', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', raw, '--out', destOg]);
  await runSips(['-c', '628', '1200', destOg]);
}

async function makeThumbJpg(id, raw, dest) {
  // segment thumb: 400px long-edge q78
  await runSips(['-Z', '400', '-s', 'format', 'jpeg', '-s', 'formatOptions', '78', raw, '--out', dest]);
}

function buildCreditsMd(story, segStories) {
  const lines = [];
  lines.push(`# ${story.title} — 圖片來源與授權`);
  lines.push('');
  lines.push('本故事集合為 **非營利個人學術展示** 使用。所有圖片均取自 Wikimedia Commons，按各檔案 PD 或 CC BY / CC BY-SA 授權使用。');
  lines.push('');
  lines.push(`生成日期：${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 封面');
  lines.push('');
  lines.push(`| 檔案 | 作者 | 年代 | 來源 |`);
  lines.push(`|---|---|---|---|`);
  lines.push(`| cover.jpg / og.jpg | ${story.cover_candidate.artist} | ${story.cover_candidate.year} | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:${story.cover_candidate.wikimedia_filename.replace(/ /g, '_')}) |`);
  lines.push('');
  for (const seg of segStories) {
    lines.push(`## ${seg.name}`);
    lines.push('');
    lines.push(`| # | Spot | 作者 | 年代 | 授權 |`);
    lines.push(`|---|---|---|---|---|`);
    seg.spots.forEach((s, i) => {
      const p = s.photo;
      lines.push(`| ${i + 1} | ${s.title} | ${p.artist} | ${p.year} | ${p.credit_line} |`);
    });
    lines.push('');
  }
  return lines.join('\n');
}

/* ── Main ── */

const storySlugs = (await readdir(SRC_JSON_DIR))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''));

console.log(`Found ${storySlugs.length} stories: ${storySlugs.join(', ')}\n`);

const TOTALS = { stories: 0, spots: 0, photos_ok: 0, photos_failed: 0 };

for (const slug of storySlugs) {
  const story = JSON.parse(await readFile(join(SRC_JSON_DIR, `${slug}.json`), 'utf8'));
  const dir = join(STORIES_DIR, slug);
  await mkdir(dir, { recursive: true });
  console.log(`\n== ${slug} ==`);

  // 1. Cover: download + make cover.jpg/og.jpg
  const coverRaw = await downloadRaw(`${slug}_cover`, story.cover_candidate.wikimedia_filename);
  if (coverRaw) {
    await makeCoverJpg(`${slug}_cover`, coverRaw, join(dir, 'cover.jpg'), join(dir, 'og.jpg'));
  }

  // 2. Per segment: download spot photos, build trailpaint.json + thumb
  for (const seg of story.segments) {
    console.log(`  -- ${seg.id} (${seg.spots.length} spots) --`);
    const projSpots = [];
    for (let i = 0; i < seg.spots.length; i++) {
      const spot = seg.spots[i];
      const spotId = `${slug}_${seg.id}_${i + 1}`;
      const raw = await downloadRaw(spotId, spot.photo.wikimedia_filename);
      let photoData = '';
      if (raw) {
        photoData = await makeSpotPhoto(spotId, raw);
        TOTALS.photos_ok++;
      } else {
        TOTALS.photos_failed++;
        // Fallback: tiny transparent 1x1 placeholder if download fails
        photoData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wD//2Q==';
      }
      // Build spot with credit appended to desc
      const descWithCredit = `${spot.desc.trim()}\n\n📷 ${spot.photo.credit_line}`;
      const projSpot = {
        id: `s${i + 1}`,
        num: i + 1,
        latlng: spot.latlng,
        title: spot.title,
        desc: descWithCredit,
        photo: photoData,
        iconId: 'pin',
        cardOffset: { x: 0, y: -60 },
      };
      if (spot.scripture_refs) projSpot.scripture_refs = spot.scripture_refs;
      if (spot.historical_refs) projSpot.historical_refs = spot.historical_refs;
      projSpots.push(projSpot);
      TOTALS.spots++;
    }

    // Segment thumb: use 1st spot's raw
    const firstSpotRaw = join(TMP, `${slug}_${seg.id}_1.raw`);
    if (existsSync(firstSpotRaw)) {
      await makeThumbJpg(`${slug}_${seg.id}_thumb`, firstSpotRaw, join(dir, `${seg.id}-thumb.jpg`));
    }

    // Write trailpaint.json
    const proj = {
      version: 4,
      name: `${story.title} — ${seg.name}`,
      center: seg.center,
      zoom: seg.zoom,
      basemapId: 'voyager',
      overlay: story.overlay,
      spots: projSpots,
      routes: [],
    };
    await writeFile(join(dir, `${seg.id}.trailpaint.json`), JSON.stringify(proj, null, 2));
  }

  // 3. Write story.json
  const storyJson = {
    id: slug,
    title: story.title,
    subtitle: story.subtitle,
    description: story.description,
    locale: 'zh-TW',
    cover: 'cover.jpg',
    music: SLUG_TO_MUSIC[slug],
    og: {
      title: `${story.title} — TrailPaint Stories`,
      description: story.description,
      image: 'og.jpg',
    },
    stories: story.segments.map((seg) => ({
      id: seg.id,
      title: seg.name,
      subtitle: seg.subtitle,
      description: seg.subtitle,
      data: `${seg.id}.trailpaint.json`,
      thumbnail: `${seg.id}-thumb.jpg`,
      color: seg.color,
      music: SLUG_TO_MUSIC[slug].src,
    })),
    footer: {
      cta: '在 TrailPaint 中建立你自己的故事地圖',
      url: 'https://trailpaint.org/app/',
    },
  };
  await writeFile(join(dir, 'story.json'), JSON.stringify(storyJson, null, 2));

  // 4. CREDITS.md
  await writeFile(join(dir, 'CREDITS.md'), buildCreditsMd(story, story.segments.map((s) => ({ name: s.name, spots: s.spots }))));

  TOTALS.stories++;
  console.log(`  ✅ ${slug} done`);
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`✅ Built ${TOTALS.stories} stories, ${TOTALS.spots} spots, ${TOTALS.photos_ok} photos ok, ${TOTALS.photos_failed} failed`);
if (FAILED.length > 0) {
  console.log('\n⚠️  Failed downloads:');
  for (const f of FAILED) console.log(`   ${f.id}  [${f.r}]  ${f.filename}`);
}
