import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { enqueueGeocode, __resetQueueForTest } from './geocodeQueue';
import * as reverseGeocodeModule from './reverseGeocode';

vi.mock('./reverseGeocode', () => ({
  reverseGeocode: vi.fn(),
}));

describe('geocodeQueue', () => {
  beforeEach(() => {
    __resetQueueForTest();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dedup: same cache key 3 times enqueue → reverseGeocode called 1 time, onResult called 3 times', async () => {
    const mockReverseGeocode = vi.spyOn(reverseGeocodeModule, 'reverseGeocode').mockResolvedValue('Taipei');
    const onResult1 = vi.fn();
    const onResult2 = vi.fn();
    const onResult3 = vi.fn();

    const latlng: [number, number] = [25.0333, 121.5652];

    enqueueGeocode({
      spotId: 'spot-1',
      latlng,
      originalTitle: 'Title 1',
      onResult: onResult1,
    });

    enqueueGeocode({
      spotId: 'spot-2',
      latlng,
      originalTitle: 'Title 2',
      onResult: onResult2,
    });

    enqueueGeocode({
      spotId: 'spot-3',
      latlng,
      originalTitle: 'Title 3',
      onResult: onResult3,
    });

    // Advance to drain 1st job
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockReverseGeocode).toHaveBeenCalledTimes(1);

    // onResult1 fires when API completes; onResult2/3 fire via microtask after cache is set
    await vi.runAllTimersAsync();

    // All 3 onResult should fire (1st triggers the API, 2nd-3rd hit cache synchronously via microtask)
    expect(onResult1).toHaveBeenCalledWith('spot-1', 'Taipei', 'Title 1');
    expect(onResult2).toHaveBeenCalledWith('spot-2', 'Taipei', 'Title 2');
    expect(onResult3).toHaveBeenCalledWith('spot-3', 'Taipei', 'Title 3');
  });

  it('throttle: 5 different coordinates → reverseGeocode called once per second', async () => {
    const mockReverseGeocode = vi.spyOn(reverseGeocodeModule, 'reverseGeocode').mockImplementation(async (latlng) => {
      return `Place at ${latlng[0].toFixed(2)}`;
    });

    const jobs = [
      { latlng: [25.0, 121.5] as [number, number], spotId: 'spot-1' },
      { latlng: [25.1, 121.6] as [number, number], spotId: 'spot-2' },
      { latlng: [25.2, 121.7] as [number, number], spotId: 'spot-3' },
      { latlng: [25.3, 121.8] as [number, number], spotId: 'spot-4' },
      { latlng: [25.4, 121.9] as [number, number], spotId: 'spot-5' },
    ];

    const onResults = jobs.map(() => vi.fn());

    jobs.forEach((job, i) => {
      enqueueGeocode({
        spotId: job.spotId,
        latlng: job.latlng,
        originalTitle: `Title ${i + 1}`,
        onResult: onResults[i],
      });
    });

    // Tick 1: 1st job processed
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockReverseGeocode).toHaveBeenCalledTimes(1);
    expect(onResults[0]).toHaveBeenCalled();

    // Tick 2: 2nd job processed
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockReverseGeocode).toHaveBeenCalledTimes(2);
    expect(onResults[1]).toHaveBeenCalled();

    // Tick 3, 4, 5: remaining jobs
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockReverseGeocode).toHaveBeenCalledTimes(3);
    expect(onResults[2]).toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    expect(mockReverseGeocode).toHaveBeenCalledTimes(4);
    expect(onResults[3]).toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    expect(mockReverseGeocode).toHaveBeenCalledTimes(5);
    expect(onResults[4]).toHaveBeenCalled();

    // Queue should be empty now
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockReverseGeocode).toHaveBeenCalledTimes(5);
  });

  it('cache hit path: enqueue with result in cache → reverseGeocode not called, onResult fires via microtask', async () => {
    const mockReverseGeocode = vi.spyOn(reverseGeocodeModule, 'reverseGeocode').mockResolvedValue('Tokyo');
    const onResult1 = vi.fn();
    const onResult2 = vi.fn();

    const latlng: [number, number] = [35.6762, 139.6503];

    // 1st enqueue: triggers API call
    enqueueGeocode({
      spotId: 'spot-1',
      latlng,
      originalTitle: 'Spot 1',
      onResult: onResult1,
    });

    await vi.advanceTimersByTimeAsync(1000);
    expect(mockReverseGeocode).toHaveBeenCalledTimes(1);
    expect(onResult1).toHaveBeenCalledWith('spot-1', 'Tokyo', 'Spot 1');

    // Clear mocks for clarity
    mockReverseGeocode.mockClear();

    // 2nd enqueue with same coords: should NOT call reverseGeocode again
    enqueueGeocode({
      spotId: 'spot-2',
      latlng,
      originalTitle: 'Spot 2',
      onResult: onResult2,
    });

    // onResult2 fires via microtask before any timer ticks
    await vi.runOnlyPendingTimersAsync();
    expect(mockReverseGeocode).toHaveBeenCalledTimes(0); // No new API call
    expect(onResult2).toHaveBeenCalledWith('spot-2', 'Tokyo', 'Spot 2');
  });

  it('originalTitle passed to callback matches enqueue input', async () => {
    const mockReverseGeocode = vi.spyOn(reverseGeocodeModule, 'reverseGeocode').mockResolvedValue('Paris');
    const onResult = vi.fn();

    const originalTitle = 'My Custom Spot Title';
    enqueueGeocode({
      spotId: 'spot-custom',
      latlng: [48.8566, 2.3522],
      originalTitle,
      onResult,
    });

    await vi.advanceTimersByTimeAsync(1000);
    expect(onResult).toHaveBeenCalledWith('spot-custom', 'Paris', originalTitle);
  });

  it('network error: reverseGeocode reject → onResult not called, queue continues', async () => {
    const mockReverseGeocode = vi.spyOn(reverseGeocodeModule, 'reverseGeocode').mockRejectedValue(new Error('Network error'));
    const onResult1 = vi.fn();
    const onResult2 = vi.fn();

    enqueueGeocode({
      spotId: 'spot-fail',
      latlng: [0.0, 0.0],
      originalTitle: 'Spot Fail',
      onResult: onResult1,
    });

    enqueueGeocode({
      spotId: 'spot-ok',
      latlng: [1.0, 1.0],
      originalTitle: 'Spot OK',
      onResult: onResult2,
    });

    // 1st job fails, onResult1 should NOT be called
    await vi.advanceTimersByTimeAsync(1000);
    expect(onResult1).not.toHaveBeenCalled();

    // Reset mock to check 2nd call
    mockReverseGeocode.mockClear();
    mockReverseGeocode.mockResolvedValueOnce('London');

    // 2nd job succeeds
    await vi.advanceTimersByTimeAsync(1000);
    expect(onResult2).toHaveBeenCalledWith('spot-ok', 'London', 'Spot OK');
  });

  it('reverseGeocode returns empty string (null result) → onResult not called, queue continues', async () => {
    const mockReverseGeocode = vi.spyOn(reverseGeocodeModule, 'reverseGeocode').mockResolvedValue('');
    const onResult1 = vi.fn();
    const onResult2 = vi.fn();

    enqueueGeocode({
      spotId: 'spot-empty',
      latlng: [0.0, 0.0],
      originalTitle: 'Spot Empty',
      onResult: onResult1,
    });

    enqueueGeocode({
      spotId: 'spot-ok',
      latlng: [1.0, 1.0],
      originalTitle: 'Spot OK',
      onResult: onResult2,
    });

    // 1st job returns empty, onResult1 should NOT be called
    await vi.advanceTimersByTimeAsync(1000);
    expect(onResult1).not.toHaveBeenCalled();

    // Reset and set 2nd to succeed
    mockReverseGeocode.mockClear();
    mockReverseGeocode.mockResolvedValueOnce('Berlin');

    // 2nd job succeeds
    await vi.advanceTimersByTimeAsync(1000);
    expect(onResult2).toHaveBeenCalledWith('spot-ok', 'Berlin', 'Spot OK');
  });

  it('__resetQueueForTest clears state between tests', async () => {
    const mockReverseGeocode = vi.spyOn(reverseGeocodeModule, 'reverseGeocode').mockResolvedValue('Vienna');
    const onResult1 = vi.fn();

    // Test 1: enqueue 1 job
    enqueueGeocode({
      spotId: 'spot-1',
      latlng: [48.2082, 16.3738],
      originalTitle: 'Vienna 1',
      onResult: onResult1,
    });

    await vi.advanceTimersByTimeAsync(1000);
    expect(onResult1).toHaveBeenCalled();

    // Reset
    __resetQueueForTest();
    mockReverseGeocode.mockClear();

    // Test 2: same coords, but cache should be empty
    const onResult2 = vi.fn();
    enqueueGeocode({
      spotId: 'spot-2',
      latlng: [48.2082, 16.3738],
      originalTitle: 'Vienna 2',
      onResult: onResult2,
    });

    // Should call reverseGeocode again (cache was cleared)
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockReverseGeocode).toHaveBeenCalledTimes(1);
    expect(onResult2).toHaveBeenCalledWith('spot-2', 'Vienna', 'Vienna 2');
  });
});
