import { describe, it, expect } from 'vitest';
import { groupSpotsForRoutes } from './connectSpots';
import type { Spot } from '../models/types';

function spot(num: number, latlng: [number, number], takenAt?: string): Spot {
  return {
    id: `s${num}`,
    latlng,
    num,
    title: `Spot ${num}`,
    desc: '',
    photo: null,
    iconId: 'pin',
    cardOffset: { x: 0, y: -60 },
    ...(takenAt && { takenAt }),
  };
}

// Local-noon timestamps avoid UTC/local day-boundary ambiguity in tests.
const D1 = '2026-04-18T12:00:00';
const D2 = '2026-04-19T12:00:00';

describe('groupSpotsForRoutes', () => {
  it('two capture days become two routes, days ascending, num order inside', () => {
    const groups = groupSpotsForRoutes([
      spot(3, [25.3, 121.3], D2),
      spot(1, [25.1, 121.1], D1),
      spot(4, [25.4, 121.4], D2),
      spot(2, [25.2, 121.2], D1),
    ]);
    expect(groups).toEqual([
      { pts: [[25.1, 121.1], [25.2, 121.2]], spotIds: ["s1", "s2"] },
      { pts: [[25.3, 121.3], [25.4, 121.4]], spotIds: ["s3", "s4"] },
    ]);
  });

  it('all same day degrades to a single route (original behavior)', () => {
    const groups = groupSpotsForRoutes([spot(2, [25.2, 121.2], D1), spot(1, [25.1, 121.1], D1)]);
    expect(groups).toEqual([{ pts: [[25.1, 121.1], [25.2, 121.2]], spotIds: ["s1", "s2"] }]);
  });

  it('no dates at all degrades to a single route (original behavior)', () => {
    const groups = groupSpotsForRoutes([spot(2, [25.2, 121.2]), spot(1, [25.1, 121.1])]);
    expect(groups).toEqual([{ pts: [[25.1, 121.1], [25.2, 121.2]], spotIds: ["s1", "s2"] }]);
  });

  it('undated spots form a trailing group after dated days', () => {
    const groups = groupSpotsForRoutes([
      spot(1, [25.1, 121.1]),
      spot(2, [25.2, 121.2], D1),
      spot(3, [25.3, 121.3], D1),
      spot(4, [25.4, 121.4]),
    ]);
    expect(groups).toEqual([
      { pts: [[25.2, 121.2], [25.3, 121.3]], spotIds: ["s2", "s3"] },
      { pts: [[25.1, 121.1], [25.4, 121.4]], spotIds: ["s1", "s4"] },
    ]);
  });

  it('single-spot day cannot form a line and is dropped', () => {
    const groups = groupSpotsForRoutes([
      spot(1, [25.1, 121.1], D1),
      spot(2, [25.2, 121.2], D1),
      spot(3, [25.3, 121.3], D2),
    ]);
    expect(groups).toEqual([{ pts: [[25.1, 121.1], [25.2, 121.2]], spotIds: ["s1", "s2"] }]);
  });

  it('unparseable takenAt falls into the undated group instead of crashing', () => {
    const groups = groupSpotsForRoutes([
      spot(1, [25.1, 121.1], 'not-a-date'),
      spot(2, [25.2, 121.2], 'also-bad'),
    ]);
    expect(groups).toEqual([{ pts: [[25.1, 121.1], [25.2, 121.2]], spotIds: ["s1", "s2"] }]);
  });
});
