import { useSyncExternalStore } from 'react';

/**
 * 017 D4: desktop-layout breakpoint. 769px matches the Sidebar drawer
 * breakpoint (Sidebar.css @media max-width: 768px) — NOT the 600px touch
 * breakpoint used by SpotCard/SpotMarker. 600-768px tablets keep the drawer.
 */
const DESKTOP_MQ = '(min-width: 769px)';

const mq = window.matchMedia(DESKTOP_MQ);

function subscribe(onChange: () => void): () => void {
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, () => mq.matches);
}
