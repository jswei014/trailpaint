# TrailPaint — Online source

Main README: [../README.md](../README.md) · [../README.en.md](../README.en.md) · [../README.ja.md](../README.ja.md)

This directory contains the TrailPaint **online version** source code (Vite + React 19 + TypeScript). Build output is written to `../app/` and served from GitHub Pages / Cloudflare Pages.

## Quick start

```bash
npm install
npm run dev        # dev server → http://localhost:5173/app/
npm run build      # build to ../app/
npm test           # vitest (205 cases)
npm run lint       # eslint
```

## Structure

```
src/
├── core/          # Pure React + Zustand, no Leaflet dependency
│   ├── components/   # ExportWizard, ImportWizard, Sidebar, etc.
│   ├── store/        # Zustand project store + temporal undo
│   ├── utils/        # GeoJSON / KML / GPX / EXIF parsers, shareLink, embedCode
│   └── models/       # Project / Spot / Route types
├── map/           # Leaflet integration layer
│   ├── MapView.tsx      # Online-map mode
│   ├── ImageMapView.tsx # Screenshot-basemap mode
│   └── ExportButton.tsx # captureMap + saveProject + exportGeojson/Kml
├── player/        # Standalone Story Player entry (/app/player/)
├── i18n/          # zh-TW / en / ja translation files
└── App.tsx        # Top-level composition
```

## Multi-page build

`vite.config.ts` uses rollup `input.main` + `input.player` to produce two independent HTML entries:
- `/app/` — Editor (main bundle)
- `/app/player/` — Story Player (smaller, read-only)

Shared utilities (embedCode, i18n) are auto chunk-split.

## Dependencies of note

- **exifr** — EXIF parser including HEIC GPS (~15KB lite build)
- **@tmcw/togeojson** — KML → GeoJSON conversion (~3KB)
- **zundo** — temporal middleware for Zustand undo/redo
- **html-to-image** — Canvas capture, with manual tile + photo drawing for iOS Safari compat (see `map/ExportButton.tsx`)

## Testing

```bash
npm test             # one-shot run
npm run test:watch   # watch mode
npm run test:ui      # vitest UI
```

Tests live next to the module (`foo.ts` + `foo.test.ts`). Coverage focus: pure logic in `core/utils/` (parsers, migration, share encoding).

## Specs

See `../openspec/changes/` for Spec-Driven Development propose/apply artifacts (not in git, local reference only).
