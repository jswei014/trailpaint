#!/usr/bin/env node
/**
 * Patch the 3 failing photos from build-new-5-stories.mjs:
 *   1. wen-tianxiang/southern-retreat spot 5 (空坑兵敗)  → Zheng Sixiao Orchid
 *   2. xu-xiake/southwest-journey spot 10 (麗江木府)      → Mu Mansion inner gate
 *   3. xu-xiake/southwest-journey spot 12 (歸家江陰)      → Xu Xiake statue at Huangshan
 *
 *   Run: node online/scripts/patch-new-5-stories-404s.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const TMP = '/tmp/tp-patch-5-404';
const UA = 'TrailPaint-example-builder/1.0 (https://trailpaint.org; https://github.com/notoriouslab/trailpaint) curl';
await mkdir(TMP, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fp = (title) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title)}`;

function runSips(args) {
  return new Promise((resolve, reject) => {
    const p = spawn('sips', args, { stdio: ['ignore', 'ignore', 'inherit'] });
    p.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`sips ${c}`))));
  });
}

function curlDownload(url, dest) {
  return new Promise((resolve) => {
    const p = spawn('curl', ['-sSL', '--max-time', '60', '-A', UA, '-o', dest, '-w', '%{http_code}'], {
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    let code = '';
    p.stdout.on('data', (d) => (code += d.toString()));
    p.on('close', () => resolve(code.trim()));
  });
}

async function fetchAndCompress(id, filename) {
  const raw = join(TMP, `${id}.raw`);
  const out = join(TMP, `${id}.jpg`);
  if (!existsSync(out)) {
    process.stdout.write(`  ${id}... `);
    const code = await new Promise((resolve) => {
      const p = spawn('curl', ['-sSL', '--max-time', '60', '-A', UA, '-o', raw, '-w', '%{http_code}', fp(filename)], {
        stdio: ['ignore', 'pipe', 'inherit'],
      });
      let c = '';
      p.stdout.on('data', (d) => (c += d.toString()));
      p.on('close', () => resolve(c.trim()));
    });
    if (!code.startsWith('2')) {
      process.stdout.write(`[${code}] FAIL\n`);
      return null;
    }
    await runSips(['-Z', '400', '-s', 'format', 'jpeg', '-s', 'formatOptions', '60', raw, '--out', out]);
    process.stdout.write('ok\n');
    await sleep(2500);
  }
  const jpg = await readFile(out);
  return `data:image/jpeg;base64,${jpg.toString('base64')}`;
}

const PATCHES = [
  {
    file: 'stories/wen-tianxiang/southern-retreat.trailpaint.json',
    idx: 4, // spot 5 (0-indexed)
    filename: 'Zheng Sixiao - Orchid - Google Art Project.jpg',
    artist: '鄭思肖',
    year: '1306',
    credit: '鄭思肖《墨蘭圖》,1306,南宋遺民畫家傳世名作,Google Art Project (Public domain via Wikimedia Commons)',
  },
  {
    file: 'stories/xu-xiake/southwest-journey.trailpaint.json',
    idx: 9, // spot 10
    filename: 'Mu Mansion inner gate.JPG',
    artist: 'Wikimedia contributor',
    year: 'modern',
    credit: '麗江木府內門 (CC BY-SA, via Wikimedia Commons)',
  },
  {
    file: 'stories/xu-xiake/southwest-journey.trailpaint.json',
    idx: 11, // spot 12
    filename: 'Xu Xiake statue, Huangshan, 2021-10-18 01.jpg',
    artist: 'Wikimedia contributor',
    year: '2021',
    credit: '黃山徐霞客像，2021 (CC BY-SA, via Wikimedia Commons)',
  },
];

let patched = 0;
for (const p of PATCHES) {
  const fullPath = join(ROOT, p.file);
  const proj = JSON.parse(await readFile(fullPath, 'utf8'));
  const id = `patch_${p.file.split('/').slice(-1)[0].replace('.trailpaint.json', '')}_${p.idx}`;
  const dataUrl = await fetchAndCompress(id, p.filename);
  if (!dataUrl) continue;
  const spot = proj.spots[p.idx];
  spot.photo = dataUrl;
  // Replace the 📷 credit line (last line after \n\n📷)
  const creditTail = `📷 ${p.credit}`;
  const desc = (spot.desc || '').replace(/\n+📷[^\n]*$/s, '').trim();
  spot.desc = `${desc}\n\n${creditTail}`;
  await writeFile(fullPath, JSON.stringify(proj, null, 2));
  console.log(`  ✅ ${p.file}[${p.idx}] patched`);
  patched++;
}
console.log(`\n✅ patched ${patched}/3`);
