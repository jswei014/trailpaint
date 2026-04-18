import type { Project } from '../models/types';

/**
 * Open the Player in a new tab with this project loaded.
 *
 * Two transports in parallel for robustness:
 *   1. localStorage — fast, but Safari's cross-tab ITP isolation can make
 *      the new tab read null even when setItem succeeded.
 *   2. postMessage after the Player posts "trailpaint-opener-ready" —
 *      survives Safari isolation and is the reliable primary mechanism.
 *
 * The Player reads whichever arrives first (localStorage check runs before
 * it falls through to the opener listener).
 */
export function openStoryMode(project: Project): void {
  const expectedOrigin = window.location.origin;

  try {
    localStorage.setItem('trailpaint-player-project', JSON.stringify(project));
  } catch {
    // Quota exceeded — fall through; postMessage will carry the payload.
  }

  const w = window.open('/app/player/', '_blank');
  if (!w) return; // popup blocked — nothing we can do

  const handler = (e: MessageEvent) => {
    if (e.origin !== expectedOrigin) return;
    if (e.source !== w) return;
    if (e.data?.type !== 'trailpaint-opener-ready') return;
    try {
      w.postMessage({ type: 'trailpaint-project', data: project }, expectedOrigin);
    } catch {
      /* new tab closed before we could post — nothing to do */
    }
    window.removeEventListener('message', handler);
  };
  window.addEventListener('message', handler);

  // Safety net: drop the listener after 30s if the new tab never pings.
  setTimeout(() => window.removeEventListener('message', handler), 30000);
}
