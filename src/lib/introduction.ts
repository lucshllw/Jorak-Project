export function isHomeReload(entry?: { type: string; name: string }): boolean {
  if (entry?.type !== 'reload') return false;
  try { return new URL(entry.name).pathname === '/'; } catch { return false; }
}

// A document reload creates a fresh module. Client navigation and remounts do not.
let consumed = false;
export function claimReloadIntroduction(): boolean {
  if (consumed || typeof window === 'undefined') return false;
  consumed = true;
  return isHomeReload(performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
