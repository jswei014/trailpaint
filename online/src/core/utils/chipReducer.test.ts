import { describe, it, expect } from 'vitest';
import { chipReduce, DOUBLE_TAP_MS, type ChipState } from './chipReducer';

const P1: [number, number] = [25.03, 121.56];
const P2: [number, number] = [25.04, 121.57];

describe('chipReduce', () => {
  it('map tap on empty state shows the chip at the tap point', () => {
    expect(chipReduce(null, { type: 'mapTap', latlng: P1, ts: 1000 })).toEqual({ latlng: P1, ts: 1000 });
  });

  it('a later tap elsewhere moves the chip', () => {
    const s: ChipState = { latlng: P1, ts: 1000 };
    expect(chipReduce(s, { type: 'mapTap', latlng: P2, ts: 2000 })).toEqual({ latlng: P2, ts: 2000 });
  });

  it('second tap inside the double-tap window retracts the chip (zoom passes through)', () => {
    const s: ChipState = { latlng: P1, ts: 1000 };
    expect(chipReduce(s, { type: 'mapTap', latlng: P2, ts: 1000 + DOUBLE_TAP_MS - 1 })).toBeNull();
  });

  it('confirm clears the chip', () => {
    expect(chipReduce({ latlng: P1, ts: 1000 }, { type: 'confirm' })).toBeNull();
  });

  it('tapping UI outside the map (bottom bar, drawer, cards) clears the chip', () => {
    expect(chipReduce({ latlng: P1, ts: 1000 }, { type: 'outside' })).toBeNull();
  });

  it('a selection appearing clears the chip (selected taps deselect instead)', () => {
    expect(chipReduce({ latlng: P1, ts: 1000 }, { type: 'selection' })).toBeNull();
  });
});
