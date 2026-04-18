import { reverseGeocode } from './reverseGeocode';

export interface GeocodeJob {
  spotId: string;
  latlng: [number, number];
  originalTitle: string;
  onResult: (spotId: string, placeName: string, originalTitle: string) => void;
}

// Module-level state: queue + cache + drain timer
let queue: GeocodeJob[] = [];
const cache = new Map<string, string>();
let drainTimer: ReturnType<typeof setInterval> | null = null;

function getCacheKey(latlng: [number, number]): string {
  const [lat, lng] = latlng;
  return `${lat.toFixed(3)}_${lng.toFixed(3)}`;
}

function drainQueue(): void {
  if (queue.length === 0) {
    if (drainTimer !== null) {
      clearInterval(drainTimer);
      drainTimer = null;
    }
    return;
  }

  const job = queue.shift();
  if (!job) return;

  reverseGeocode(job.latlng)
    .then((result) => {
      // result is '' on failure, null on error — treat both as "no result"
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      if (result && result.length > 0) {
        const cacheKey = getCacheKey(job.latlng);
        cache.set(cacheKey, result);
        job.onResult(job.spotId, result, job.originalTitle);
      }
      // On error or null: don't call onResult, job is silently completed
    })
    .catch(() => {
      // Network error: silently skip, don't call onResult
    });
}

export function enqueueGeocode(job: GeocodeJob): void {
  const cacheKey = getCacheKey(job.latlng);

  // Cache hit: call onResult asynchronously (avoid reentrancy)
  if (cache.has(cacheKey)) {
    const placeName = cache.get(cacheKey)!;
    queueMicrotask(() => {
      job.onResult(job.spotId, placeName, job.originalTitle);
    });
    return;
  }

  // Cache miss: enqueue job
  queue.push(job);

  // Start drain timer if not already running
  if (drainTimer === null) {
    drainTimer = setInterval(drainQueue, 1000);
  }
}

export function __resetQueueForTest(): void {
  queue = [];
  cache.clear();
  if (drainTimer !== null) {
    clearInterval(drainTimer);
    drainTimer = null;
  }
}
