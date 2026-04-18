import type { Spot } from '../models/types';

/**
 * Compute the center + zoom to fit a bounding box of latlng points.
 * Returns null when the input is empty (caller keeps current viewport).
 */
export function computeBoundingBoxCenter(
  pts: [number, number][],
): { center: [number, number]; zoom: number } | null {
  if (pts.length === 0) return null;
  const lats = pts.map((p) => p[0]);
  const lngs = pts.map((p) => p[1]);
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
