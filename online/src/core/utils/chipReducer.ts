/**
 * 017 D5: tap-to-add chip state machine (mobile ≤600px).
 *
 * Pure reducer so the interaction rules are unit-testable:
 * - tap on empty map        → chip appears at tap point
 * - tap elsewhere on map    → chip moves
 * - second tap within the double-tap window → chip cancelled (Leaflet's
 *   native doubleClickZoom handles the zoom; we only retract our side effect)
 * - confirm / tap outside the map / a selection appearing → chip gone
 */

export const DOUBLE_TAP_MS = 250;

export type ChipState = { latlng: [number, number]; ts: number } | null;

export type ChipEvent =
  | { type: 'mapTap'; latlng: [number, number]; ts: number }
  | { type: 'confirm' }
  | { type: 'outside' }
  | { type: 'selection' };

export function chipReduce(state: ChipState, ev: ChipEvent): ChipState {
  switch (ev.type) {
    case 'mapTap':
      if (state && ev.ts - state.ts < DOUBLE_TAP_MS) {
        // Double-tap: retract the chip, let Leaflet zoom.
        return null;
      }
      return { latlng: ev.latlng, ts: ev.ts };
    case 'confirm':
    case 'outside':
    case 'selection':
      return null;
  }
}
