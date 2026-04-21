#!/usr/bin/env node
// Audit which spots are missing photos in every .trailpaint.json we care about.
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const TARGETS = [
  join(ROOT, 'stories', 'passion-week'),
  join(ROOT, 'stories', 'taiwan-missionaries'),
  join(ROOT, 'online', 'src', 'data', 'examples'),
];

for (const dir of TARGETS) {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.trailpaint.json'));
  console.log(`\n=== ${dir.split('/').slice(-3).join('/')} ===`);
  for (const f of files) {
    const proj = JSON.parse(await readFile(join(dir, f), 'utf8'));
    const total = proj.spots.length;
    const withPhoto = proj.spots.filter((s) => s.photo && s.photo.startsWith('data:')).length;
    const mark = withPhoto === total ? '✅' : withPhoto === 0 ? '❌' : '⚠️ ';
    const missing = proj.spots
      .map((s, i) => ({ i, title: s.title, has: !!(s.photo && s.photo.startsWith('data:')) }))
      .filter((s) => !s.has)
      .map((s) => `#${s.i + 1}${s.title ? ` ${s.title}` : ''}`);
    console.log(`${mark} ${f.padEnd(46)} ${withPhoto}/${total}${missing.length ? '  missing: ' + missing.join(', ') : ''}`);
  }
}
