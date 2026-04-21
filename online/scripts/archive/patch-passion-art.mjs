#!/usr/bin/env node
/**
 * Replace 5 spot photos in passion-week stories:
 *   1. entry spot 4 寡婦小錢    → Tissot《Widow's Mite》（was El Greco reuse，主題錯）
 *   2. passion spot 1 客西馬尼  → Mantegna《Agony in the Garden》（was 現代照）
 *   3. passion spot 6 百夫長認信→ Tissot《Confession of the Centurion》（was Leonardo 晚餐，主題錯）
 *   4. resurrection spot 1 以馬忤斯→ Rembrandt《Supper at Emmaus》1648（was Caravaggio，去重複）
 *   5. resurrection spot 3 升天  → Rembrandt《The Ascension》1636（was olives-panorama，主題錯）
 *
 *   Run: node online/scripts/patch-passion-art.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const TMP = '/tmp/tp-patch-passion';
const UA = 'TrailPaint-example-builder/1.0 (https://trailpaint.org; https://github.com/notoriouslab/trailpaint) curl';
await mkdir(TMP, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runSips(args) {
  return new Promise((resolve, reject) => {
    const p = spawn('sips', args, { stdio: ['ignore', 'ignore', 'inherit'] });
    p.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`sips ${c}`))));
  });
}

async function curlDownload(url, dest) {
  return new Promise((resolve) => {
    const p = spawn('curl', ['-sSL', '--max-time', '60', '-A', UA, '-o', dest, '-w', '%{http_code}', url], {
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    let code = '';
    p.stdout.on('data', (d) => (code += d.toString()));
    p.on('close', (x) => {
      if (x !== 0) resolve(`curl_${x}`);
      else resolve(code.trim());
    });
  });
}

const FAILED = [];

async function fetchWithRetry(url, id, dest) {
  const backoffs = [10000, 30000, 60000];
  for (let attempt = 0; attempt <= backoffs.length; attempt++) {
    const code = await curlDownload(url, dest);
    if (code.startsWith('2')) return 'ok';
    if (code === '404') return '404';
    if ((code === '429' || code.startsWith('5') || code.startsWith('curl_')) && attempt < backoffs.length) {
      const wait = backoffs[attempt];
      process.stdout.write(`[${code}, wait ${wait / 1000}s] `);
      await sleep(wait);
      continue;
    }
    return `fail_${code}`;
  }
  return 'exhausted';
}

async function fetchAndCompress(id, url) {
  const raw = join(TMP, `${id}.raw`);
  const out = join(TMP, `${id}.jpg`);
  if (!existsSync(out)) {
    process.stdout.write(`  ${id}... `);
    const r = await fetchWithRetry(url, id, raw);
    if (r !== 'ok') {
      process.stdout.write(`[${r}] SKIP\n`);
      FAILED.push({ id, url, r });
      return null;
    }
    // 400px long-edge, quality 60 — 目標 ~30KB base64 對齊舊圖平均 (sips 比 PIL 寬鬆，需降 15 點)
    await runSips(['-Z', '400', '-s', 'format', 'jpeg', '-s', 'formatOptions', '60', raw, '--out', out]);
    process.stdout.write('ok\n');
    await sleep(2500);
  }
  const jpg = await readFile(out);
  return `data:image/jpeg;base64,${jpg.toString('base64')}`;
}

// Wikimedia Special:FilePath auto-resolves to correct CDN URL (survives file moves).
const fp = (title) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title)}`;

const PATCHES = [
  {
    file: 'stories/passion-week/entry.trailpaint.json',
    idPrefix: 'pw_entry',
    spots: [
      { idx: 4,
        url: fp("Brooklyn Museum - The Widow's Mite (Le denier de la veuve) - James Tissot.jpg"),
        credit: 'James Tissot《The Widow’s Mite》c.1890 (PD, 作者 1902 歿，Brooklyn Museum)' },
    ],
  },
  {
    file: 'stories/passion-week/passion.trailpaint.json',
    idPrefix: 'pw_passion',
    spots: [
      { idx: 1,
        url: fp('Mantegna, Andrea - Agony in the Garden - National Gallery, London.jpg'),
        credit: 'Andrea Mantegna《Agony in the Garden》c.1455 (PD, 作者 1506 歿，National Gallery London)' },
      { idx: 6,
        url: fp('Brooklyn Museum - The Confession of the Centurion (La Confession du Centurion) - James Tissot.jpg'),
        credit: 'James Tissot《The Confession of the Centurion》c.1890 (PD, 作者 1902 歿，Brooklyn Museum)' },
    ],
  },
  {
    file: 'stories/passion-week/resurrection.trailpaint.json',
    idPrefix: 'pw_resurr',
    spots: [
      { idx: 1,
        url: fp('Rembrandt - Supper at Emmaus - WGA19115.jpg'),
        credit: 'Rembrandt《Supper at Emmaus》1648 (PD, 作者 1669 歿，Louvre)' },
      { idx: 3,
        url: fp('Rembrandt The Ascension 1636 Oil on canvas Alte Pinakothek Munich Germany.jpg'),
        credit: 'Rembrandt《The Ascension of Christ》1636 (PD, 作者 1669 歿，Alte Pinakothek München)' },
    ],
  },
];

let patched = 0;
for (const p of PATCHES) {
  const path = join(ROOT, p.file);
  const proj = JSON.parse(await readFile(path, 'utf8'));
  console.log(`\n== ${p.file} ==`);
  for (const { idx, url, credit } of p.spots) {
    const id = `${p.idPrefix}_${idx}`;
    const dataUrl = await fetchAndCompress(id, url);
    if (!dataUrl) continue;
    const spot = proj.spots[idx];
    spot.photo = dataUrl;
    const creditTail = `📷 ${credit}`;
    const desc = spot.desc || '';
    // Remove any prior 📷 credit (idempotent re-run).
    const desc2 = desc.replace(/\n+📷[^\n]*$/s, '').trim();
    spot.desc = `${desc2}\n\n${creditTail}`;
    patched++;
  }
  await writeFile(path, JSON.stringify(proj, null, 2));
}

console.log(`\n✅ patched ${patched} spots`);
if (FAILED.length > 0) {
  console.log('\n⚠️  failed:');
  for (const f of FAILED) console.log(`   ${f.id}  [${f.r}]  ${f.url}`);
  process.exit(1);
}
