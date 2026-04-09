# TrailPaint

> Turn any map into a beautiful educational or guided ecological map in minutes

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](LICENSE)
[![No Install](https://img.shields.io/badge/No%20Install-Just%20Open-orange.svg)](#)

---

## What is this?

TrailPaint is a **zero-install, browser-only** hand-drawn map maker.

![trailpaint/examples/trailpaint-map.jpg](./examples/trailpaint-map.jpg)

Upload a screenshot from Google Maps / OpenStreetMap / Apple Maps and create a map with:

- 🟠 **Hand-drawn routes** — dashed lines + arrows, easy to follow at a glance
- 📍 **Point-of-interest cards** — draggable, with name, description, and on-site photos
- 🩹 **Cover-up tool** — hide ads, business info, or anything you don't want shown
- 🎨 **Watercolor filter** — one click to give the base map a soft, muted look
- 💾 **High-res export** — full-resolution PNG ready for print or sharing

## Who is it for?

| Audience | Use case |
|----------|----------|
| 🌲 National parks, forestry agencies, nature reserves | Signage, guidebook illustrations |
| 🦋 Ecotourism operators, B&Bs, tour guides | Itinerary maps, custom trail guides |
| 🎒 Hiking clubs, environmental education NGOs, schools | Teaching materials, event maps |
| 🏡 Community organizers, independent trail builders | Community guides, trail documentation |

## Getting Started

**Online (recommended)**

Just open the URL — no installation needed:

```
https://notoriouslab.github.io/trailpaint/
```

**Offline**

Download [`trailpaint.html`](trailpaint.html) and open it in any browser. **No internet required.**

> ⚠️ Opening local HTML files directly on iOS may be restricted by Safari security policies. Use the online version or a local HTTP server instead.

## How to Use

```
1. Upload  →  Take a screenshot of Google Maps / OpenStreetMap / Apple Maps and upload it
2. Route   →  Click points on the map to draw a path, then press "Finish Route"
3. Markers →  Click to place numbered markers, fill in name, description, and photos
4. Cover   →  Drag to select areas you want to hide
5. Export  →  Press "Export" to get a high-resolution PNG
```

![trailpaint/examples/trailpaint-map.jpg](./examples/trailpaint-map-01.jpg)

**Mobile / Tablet Gestures**

| Gesture | Action |
|---------|--------|
| Single tap | Place route point / marker |
| Long press (650ms) | Quick-add a marker |
| Single-finger drag (Select mode) | Pan the map |
| Pinch | Zoom in/out |
| Drag info card | Reposition the card |

## Features

| Feature | Description |
|---------|-------------|
| **Route Drawing** | Click to place points; auto-connected with hand-drawn dashed lines + arrows. Multiple routes supported |
| **Markers** | Numbered circle markers with title card, description text, and photo attachment |
| **Card Dragging** | Drag info cards freely to avoid overlapping important areas |
| **Area Cover-up** | Select regions to hide (ads, irrelevant text). Three cover styles: frosted / soft / paper |
| **Watercolor Filter** | One-click pastel tone — desaturates, softens contrast, adds subtle vignette |
| **Hi-Res Export** | Outputs full-resolution PNG, print-ready |
| **Project Save/Load** | Save to JSON file; reload later to continue editing (includes base map and photos) |
| **Undo / Redo** | Ctrl+Z / Cmd+Z supported — all edits are reversible |
| **Desktop Zoom** | Scroll wheel zoom, centered on cursor position |
| **Watermark Toggle** | The "TrailPaint" watermark on exported images can be turned off |
| **21 Icons** | Ecology (plants, birds, insects...) + facilities (restroom, parking, first aid...) |
| **Zero Install** | Single HTML file, runs in any browser, no backend or network needed |

## Marker Icons

21 built-in ecology and facility icons:

🌿 Plant 🌸 Flower 🌲 Tree 🐦 Bird 🦋 Insect  
💧 Water 🐟 Fish 🍄 Mushroom ⛰️ Rock  
🚻 Restroom 🚌 Bus Stop 🪑 Rest Area 🥤 Food 🚲 Bicycle  
🅿️ Parking 🩺 First Aid 🔭 Viewpoint 📷 Photo Spot ⚠️ Caution ℹ️ Info 📍 Pin

## Technical Architecture

- **Frontend**: Preact (React compat mode) + pure Browser API (no backend, no database)
- **Map Rendering**: SVG overlay + Canvas export
- **Hand-drawn Effect**: Canvas pixel manipulation (desaturation + grain + vignette)
- **Cover-up**: Canvas clipping + Gaussian blur
- **Offline Support**: Single HTML file with embedded Preact UMD bundle

## Development

```bash
git clone https://github.com/notoriouslab/trailpaint.git
cd trailpaint

# Open directly (no build needed)
open trailpaint.html

# Or start a local server (recommended for iOS development)
python3 -m http.server 8080
```

Source code lives directly in `trailpaint.html` — no build tools required.

## Known Limitations

- Opening local HTML files on iOS may have limited JavaScript functionality
- Marker photos use `URL.createObjectURL()` and are released when the tab is closed
- Large photos may take 1–2 seconds to decode during export

## Want a More Hand-Drawn Look?

You can take the exported image from TrailPaint and feed it to ChatGPT / Google Gemini with a prompt like "turn this into a cartoon-style map" to get an even more hand-drawn aesthetic!

![Gemini_Generated_Image.jpg](./examples/Gemini_Generated_Image.jpg)

## Contributing

PRs and issues are welcome! We'd especially love:

- [ ] More hand-drawn themes (forest, ocean, mountain)
- [ ] Multi-language support (Japanese, etc.)
- [ ] Export marker descriptions as a companion PDF
- [ ] Export to GeoJSON / KML format

## License

GPL-3.0 License — free to use and modify. Derivative works must also be open-sourced under GPL-3.0. **No closed-source commercial use.**

---

*TrailPaint was originally inspired by the park ecology exploration course at Taipei Bread of Life Church's Zhifu Yiren Academy and professional outdoor ecology guide needs — we hope it helps more people easily create beautiful nature education maps. 🌿*
