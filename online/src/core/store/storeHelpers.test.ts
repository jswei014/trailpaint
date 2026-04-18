import { describe, it, expect } from 'vitest';
import { computeBoundingBoxCenter, renumberSpots, spreadNewSpotOffsets } from './storeHelpers';
import type { Spot } from '../models/types';
import { DEFAULT_CARD_OFFSET } from '../models/types';

function mkSpot(overrides: Partial<Spot> = {}): Spot {
  return {
    id: crypto.randomUUID(),
    latlng: [0, 0],
    num: 0,
    title: 'x',
    desc: '',
    photo: null,
    iconId: 'pin',
    cardOffset: { ...DEFAULT_CARD_OFFSET },
    ...overrides,
  };
}

describe('computeBoundingBoxCenter', () => {
  it('returns null for empty input', () => {
    expect(computeBoundingBoxCenter([])).toBeNull();
  });

  it('returns the single point unchanged for 1-point input', () => {
    expect(computeBoundingBoxCenter([[23.5, 121]])).toEqual({ center: [23.5, 121], zoom: 12 });
  });

  it('returns midpoint of min/max lat/lng (no outlier weighting)', () => {
    const pts: [number, number][] = [[10, 100], [30, 140], [20, 120]];
    const result = computeBoundingBoxCenter(pts);
    expect(result).toEqual({ center: [20, 120], zoom: 12 });
  });

  it('handles crossing equator/meridian', () => {
    const result = computeBoundingBoxCenter([[-10, -50], [10, 50]]);
    expect(result).toEqual({ center: [0, 0], zoom: 12 });
  });

  it('filters NaN/Infinity points so they cannot poison the center (A5)', () => {
    const pts: [number, number][] = [[NaN, 100], [23.5, 121], [Infinity, -Infinity]];
    const result = computeBoundingBoxCenter(pts);
    expect(result).toEqual({ center: [23.5, 121], zoom: 12 });
  });

  it('returns null when every point is non-finite', () => {
    expect(computeBoundingBoxCenter([[NaN, NaN], [Infinity, 0]])).toBeNull();
  });
});

describe('spreadNewSpotOffsets (010 UX: cardOffset anti-overlap)', () => {
  it('leaves a lone new spot at its default offset', () => {
    const s = mkSpot({ latlng: [25, 121] });
    const result = spreadNewSpotOffsets([], [s]);
    expect(result[0].cardOffset).toEqual(s.cardOffset);
  });

  it('spreads the 2nd..8th spots in the same cell around the pin', () => {
    const spots = Array.from({ length: 8 }, () => mkSpot({ latlng: [25, 121] }));
    const result = spreadNewSpotOffsets([], spots);
    expect(result[0].cardOffset).toEqual(spots[0].cardOffset); // 1st: default
    // 2nd..8th should be distinct and pulled from the spread table
    const offsets = result.slice(1).map((s) => s.cardOffset);
    const unique = new Set(offsets.map((o) => `${o.x},${o.y}`));
    expect(unique.size).toBe(7);
  });

  it('does not touch existing spots, only new ones', () => {
    const existing = [
      mkSpot({ latlng: [25, 121], cardOffset: { x: 999, y: 999 } }),
    ];
    const newSpots = [mkSpot({ latlng: [25, 121] })];
    const result = spreadNewSpotOffsets(existing, newSpots);
    // Existing kept its quirky offset (not in returned array but untouched)
    expect(existing[0].cardOffset).toEqual({ x: 999, y: 999 });
    // New spot gets spread because cell was occupied
    expect(result[0].cardOffset).not.toEqual({ x: 0, y: -60 });
  });

  it('groups only by ~100m (3 decimal places), so far-apart spots are independent', () => {
    const a = mkSpot({ latlng: [25.001, 121.001] });
    const b = mkSpot({ latlng: [26.000, 122.000] }); // far
    const c = mkSpot({ latlng: [25.0014, 121.0014] }); // within 100m of a
    const result = spreadNewSpotOffsets([], [a, b, c]);
    expect(result[0].cardOffset).toEqual(a.cardOffset); // first in its cell
    expect(result[1].cardOffset).toEqual(b.cardOffset); // first in its (different) cell
    expect(result[2].cardOffset).not.toEqual(c.cardOffset); // second in a's cell → spread
  });

  it('wraps around when more than 8 spots share a cell', () => {
    const spots = Array.from({ length: 10 }, () => mkSpot({ latlng: [25, 121] }));
    const result = spreadNewSpotOffsets([], spots);
    // 9th spot (index 8) should reuse position at (nth=8 → index 7 % 7 = 0)
    // i.e. same as 2nd spot
    expect(result[8].cardOffset).toEqual(result[1].cardOffset);
  });
});

describe('renumberSpots', () => {
  it('returns empty array for empty input', () => {
    expect(renumberSpots([])).toEqual([]);
  });

  it('renumbers from 1 sequentially, preserving order', () => {
    const spots = [
      mkSpot({ num: 5, title: 'a' }),
      mkSpot({ num: 99, title: 'b' }),
      mkSpot({ num: 0, title: 'c' }),
    ];
    const result = renumberSpots(spots);
    expect(result.map((s) => s.num)).toEqual([1, 2, 3]);
    expect(result.map((s) => s.title)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate input array', () => {
    const spots = [mkSpot({ num: 7 })];
    renumberSpots(spots);
    expect(spots[0].num).toBe(7);
  });
});
