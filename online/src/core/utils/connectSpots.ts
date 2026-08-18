import type { Spot } from '../models/types';

/**
 * 018: group spots into route point-lists for "connect spots as route".
 *
 * Spots with a capture date (takenAt) group by LOCAL calendar day — a
 * multi-day trip becomes one route per day, matching how people narrate a
 * journey. Undated spots form a single trailing group. Groups keep spot-num
 * order internally; day groups sort ascending. Single-spot groups can't form
 * a line and are dropped. A project that all lands in one group (same day,
 * or no dates at all) degrades to the original single-route behavior.
 */
export function groupSpotsForRoutes(spots: Spot[]): [number, number][][] {
  const sorted = [...spots].sort((a, b) => a.num - b.num);

  const groups = new Map<string, [number, number][]>();
  for (const sp of sorted) {
    let key = ''; // '' = undated group, always sorts last
    if (sp.takenAt) {
      const d = new Date(sp.takenAt);
      if (!isNaN(d.getTime())) {
        // Local date, not ISO/UTC slice: a 23:00 photo belongs to the day the
        // traveler experienced, not the UTC calendar.
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
    const pts = groups.get(key);
    if (pts) pts.push(sp.latlng);
    else groups.set(key, [sp.latlng]);
  }

  const keys = [...groups.keys()].sort((a, b) => {
    if (a === '') return 1;
    if (b === '') return -1;
    return a.localeCompare(b);
  });

  return keys.map((k) => groups.get(k)!).filter((pts) => pts.length >= 2);
}
