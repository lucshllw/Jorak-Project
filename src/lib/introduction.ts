export function isHomeEntry(entry?: { type: string; name: string }): boolean {
  try { return new URL(entry?.name || '').pathname === '/'; } catch { return false; }
}

export function claimHomeIntroduction(): boolean {
  if (typeof window === 'undefined') return false;
  // Each home mount starts its own introduction; no document/session latch.
  return isHomeEntry({type:'navigate',name:window.location.href})
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
