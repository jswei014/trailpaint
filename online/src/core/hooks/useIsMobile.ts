import { useSyncExternalStore } from 'react';

/**
 * 017 D5: touch-interaction breakpoint — matches SpotMarker/SpotCard's
 * MOBILE_MQ (600px), NOT the 769px desktop-layout breakpoint. 601-768px
 * tablets keep the classic mode toolbar and floating actions.
 */
const MOBILE_MQ = '(max-width: 600px)';

const mq = window.matchMedia(MOBILE_MQ);

function subscribe(onChange: () => void): () => void {
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => mq.matches);
}
