/**
 * StartCards visibility logic (017 D1).
 *
 * The action cards cover the map only on a truly empty project. A pending
 * story-mode restore (App.tsx effect) must suppress the first paint so the
 * cards don't flash for one frame before the project loads back in.
 */

export const EDITOR_RESTORE_KEY = 'trailpaint-editor-restore';
const RESTORE_TTL_MS = 60 * 60 * 1000; // mirrors App.tsx restore expiry

/**
 * True when a story-mode restore snapshot exists and is still fresh enough
 * for App's restore effect to consume it. Pure: caller supplies raw value
 * and clock so the expiry rule stays unit-testable.
 */
export function hasPendingEditorRestore(raw: string | null, now: number): boolean {
  if (!raw) return false;
  try {
    const { project, savedAt } = JSON.parse(raw) as { project?: unknown; savedAt?: unknown };
    return Boolean(project) && typeof savedAt === 'number' && now - savedAt < RESTORE_TTL_MS;
  } catch {
    return false;
  }
}

export interface StartCardsVisibilityOpts {
  spotCount: number;
  routeCount: number;
  baseMode: 'map' | 'image';
  restorePending: boolean;
  dismissed: boolean;
}

/** Empty project (map mode, no content), no pending restore, not dismissed. */
export function shouldShowStartCards(opts: StartCardsVisibilityOpts): boolean {
  return (
    opts.spotCount === 0 &&
    opts.routeCount === 0 &&
    opts.baseMode === 'map' &&
    !opts.restorePending &&
    !opts.dismissed
  );
}
