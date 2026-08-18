import { describe, it, expect } from 'vitest';
import { hasPendingEditorRestore, shouldShowStartCards } from './startCards';

const NOW = 1_755_000_000_000;

function restoreRaw(savedAt: number): string {
  return JSON.stringify({ project: { name: 'x', spots: [], routes: [] }, savedAt });
}

describe('hasPendingEditorRestore', () => {
  it('true for a fresh snapshot', () => {
    expect(hasPendingEditorRestore(restoreRaw(NOW - 5 * 60 * 1000), NOW)).toBe(true);
  });

  it('false for an expired snapshot (>1h, App restore effect would discard it)', () => {
    expect(hasPendingEditorRestore(restoreRaw(NOW - 2 * 60 * 60 * 1000), NOW)).toBe(false);
  });

  it('false for missing key, malformed JSON, or missing fields', () => {
    expect(hasPendingEditorRestore(null, NOW)).toBe(false);
    expect(hasPendingEditorRestore('{not json', NOW)).toBe(false);
    expect(hasPendingEditorRestore(JSON.stringify({ savedAt: NOW }), NOW)).toBe(false);
    expect(hasPendingEditorRestore(JSON.stringify({ project: {}, savedAt: 'x' }), NOW)).toBe(false);
  });
});

describe('shouldShowStartCards', () => {
  const empty = {
    spotCount: 0,
    routeCount: 0,
    baseMode: 'map' as const,
    restorePending: false,
    dismissed: false,
  };

  it('shows on a truly empty map-mode project', () => {
    expect(shouldShowStartCards(empty)).toBe(true);
  });

  it('hides once any content exists (spot, route, or image basemode)', () => {
    expect(shouldShowStartCards({ ...empty, spotCount: 1 })).toBe(false);
    expect(shouldShowStartCards({ ...empty, routeCount: 1 })).toBe(false);
    expect(shouldShowStartCards({ ...empty, baseMode: 'image' })).toBe(false);
  });

  it('suppressed while a story-mode restore is pending (R5 no-flash)', () => {
    expect(shouldShowStartCards({ ...empty, restorePending: true })).toBe(false);
  });

  it('hidden after manual dismiss (🗺️ start-on-map)', () => {
    expect(shouldShowStartCards({ ...empty, dismissed: true })).toBe(false);
  });
});
