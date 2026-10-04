import type { Segment } from './types';

export function formatTime(value: number) {
  const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  const minutes = Math.floor(seconds / 60), rest = String(seconds % 60).padStart(2, '0');
  return minutes >= 60 ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

export function confirmedRange(segment: Segment | undefined): segment is Segment & { start: number; end: number } {
  return Boolean(segment && Number.isFinite(segment.start) && Number.isFinite(segment.end)
    && segment.start != null && segment.end != null && segment.start >= 0 && segment.end > segment.start
    && segment.rangeStatus !== 'inferred' && segment.rangeStatus !== 'pending');
}

export function fileMediaUrl(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith('/') && !url.startsWith('//') && !/[\\\u0000-\u001f]/.test(url)) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
    if (/(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be|x\.com|twitter\.com)$/.test(parsed.hostname)) return null;
    return parsed.href;
  } catch { return null; }
}

export function youtubeId(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url), host = parsed.hostname.toLowerCase();
    const id = host === 'youtu.be' ? parsed.pathname.slice(1).split('/')[0]
      : /(^|\.)youtube\.com$/.test(host) ? parsed.searchParams.get('v') || (/(^|\/)shorts\/|(^|\/)embed\//.test(parsed.pathname) ? parsed.pathname.split('/')[2] : '') : '';
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

export function announcePlayback(owner: string) {
  window.dispatchEvent(new CustomEvent('jorak:media-play', { detail: { owner } }));
}
