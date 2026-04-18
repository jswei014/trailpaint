// Provide browser globals that top-level module code reads at import time
// (e.g. useProjectStore reads window.innerWidth when the store is created).
// Only adds globals that are missing so we don't clobber jsdom if present.
if (typeof (globalThis as { window?: unknown }).window === 'undefined') {
  (globalThis as unknown as { window: Window }).window = {
    innerWidth: 1024,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as Window;
}
