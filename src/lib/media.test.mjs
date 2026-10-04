import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmedRange, fileMediaUrl, youtubeId, formatTime } from './media.ts';

test('only confirmed, finite, ordered ranges permit a personal clip', () => {
  const segment = { start: 241, end: 270, rangeStatus: 'explicit' };
  assert.equal(confirmedRange(segment), true);
  for (const change of [{ start: null }, { end: null }, { start: -1 }, { end: 241 }, { end: Infinity }, { start: NaN }, { rangeStatus: 'inferred' }, { rangeStatus: 'pending' }]) {
    assert.equal(confirmedRange({ ...segment, ...change }), false);
  }
  assert.equal(confirmedRange(undefined), false);
});

test('native media accepts site files or HTTPS assets, never social embeds or credential URLs', () => {
  assert.equal(fileMediaUrl('/api/media/123'), '/api/media/123');
  assert.equal(fileMediaUrl('https://storage.example/clip.mp4'), 'https://storage.example/clip.mp4');
  for (const url of ['//evil.example/a', '/\\evil.example/a', '/clip\n.mp4', 'javascript:alert(1)', 'data:video/mp4;base64,x', 'http://example.com/a', 'https://user:pass@example.com/a', 'https://www.youtube.com/watch?v=EhAcLuI68ro', 'https://youtu.be/EhAcLuI68ro', 'https://www.youtube-nocookie.com/embed/EhAcLuI68ro', 'https://x.com/video/1']) assert.equal(fileMediaUrl(url), null);
});

test('YouTube identifiers come only from the actual host and a complete identifier', () => {
  for (const url of ['https://www.youtube.com/watch?v=EhAcLuI68ro', 'https://youtu.be/EhAcLuI68ro?t=12', 'https://youtube.com/shorts/EhAcLuI68ro', 'https://youtube.com/embed/EhAcLuI68ro']) assert.equal(youtubeId(url), 'EhAcLuI68ro');
  for (const url of [null, 'https://youtube.com.evil.example/watch?v=EhAcLuI68ro', 'https://evil.example/?v=EhAcLuI68ro', 'https://youtube.com/watch?v=abc']) assert.equal(youtubeId(url), null);
  assert.equal(formatTime(3665), '1:01:05'); assert.equal(formatTime(NaN), '0:00');
});
