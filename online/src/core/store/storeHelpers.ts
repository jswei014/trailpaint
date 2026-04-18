import type { Spot } from '../models/types';

/**
 * Compute the center + zoom to fit a bounding box of latlng points.
 * Returns null when the input is empty (caller keeps current viewport).
 */
export function computeBoundingBoxCenter(
  pts: [number, number][],
): { center: [number, number]; zoom: number } | null {
  // Filter out non-finite pairs so a single malformed point (e.g. NaN from
  // a broken import) cannot poison the bounding box with NaN center.
  const valid = pts.filter(
    (p) => Array.isArray(p) && p.length >= 2 && isFinite(p[0]) && isFinite(p[1]),
  );
  if (valid.length === 0) return null;
  const lats = valid.map((p) => p[0]);
  const lngs = valid.map((p) => p[1]);
  const center: [number, number] = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
  return { center, zoom: 12 };
}

/**
 * Renumber spots sequentially starting from 1. Used after import/reorder/remove.
 */
export function renumberSpots(spots: Spot[]): Spot[] {
  return spots.map((s, i) => ({ ...s, num: i + 1 }));
}

// cardOffset positions for the 2nd..8th spot in the same ~100m cell.
// Skips "top" because that's the default new-spot offset, so the first spot
// in a cell keeps the natural position.
const SPREAD_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 85, y: -60 },   // upper-right
  { x: 100, y: 0 },    // right
  { x: 85, y: 60 },    // lower-right
  { x: 0, y: 90 },     // bottom
  { x: -85, y: 60 },   // lower-left
  { x: -100, y: 0 },   // left
  { x: -85, y: -60 },  // upper-left
];

function coordCellKey(s: Spot): string {
  // 3 decimal places ≈ 100m, matches geocodeQueue's dedup cell size
  return `${s.latlng[0].toFixed(3)}_${s.latlng[1].toFixed(3)}`;
}

/**
 * Assign spread cardOffset to newSpots when they pile on the same ~100m cell
 * as another spot (existing or earlier in the new batch). Existing spot
 * offsets are never touched — the user may have positioned them manually.
 *
 * Spots returned in the same order as `newSpots`.
 */
export function spreadNewSpotOffsets(existing: Spot[], newSpots: Spot[]): Spot[] {
  const cellCount = new Map<string, number>();
  for (const s of existing) {
    const k = coordCellKey(s);
    cellCount.set(k, (cellCount.get(k) ?? 0) + 1);
  }
  return newSpots.map((s) => {
    const k = coordCellKey(s);
    const nth = cellCount.get(k) ?? 0;
    cellCount.set(k, nth + 1);
    if (nth === 0) return s; // first spot in cell — keep whatever default it had
    const pos = SPREAD_POSITIONS[(nth - 1) % SPREAD_POSITIONS.length];
    return { ...s, cardOffset: { ...pos } };
  });
}
