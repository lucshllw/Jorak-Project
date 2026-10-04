import 'server-only';
import path from 'node:path';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { getMode, guardRequest, HttpError } from './config';
import { localDirectory, readLocalData } from './local-store';
import { databaseError, serviceSupabase } from './supabase';
import { getPublishedPortfolio } from './repository';

function isReferenced(url: string, data: Awaited<ReturnType<typeof getPublishedPortfolio>>) {
  if (data.settings.avatarUrl === url || data.settings.showreelUrl === url) return true;
  return data.projects.some(project => project.coverUrl === url || project.processImages.includes(url) || project.segments.some(segment => segment.clipUrl === url || segment.previewUrl === url));
}
export async function serveMedia(request: Request, id: string): Promise<Response> {
  guardRequest(request);
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new HttpError(404, 'Arquivo não encontrado.');
  const data = await getPublishedPortfolio();
  if (!isReferenced(`/api/media/${id}`, data)) throw new HttpError(404, 'Arquivo não encontrado.');
  if (getMode() === 'supabase') {
    // A autorização foi avaliada pelo projeto publicado, não pelo conhecimento da URL.
    const client = serviceSupabase();
    const found = await client.from('portfolio_media').select('filename').eq('id', id).maybeSingle();
    databaseError(found.error, 'Não foi possível carregar o arquivo.');
    if (!found.data) throw new HttpError(404, 'Arquivo não encontrado.');
    const signed = await client.storage.from('portfolio-media').createSignedUrl(found.data.filename, 60);
    databaseError(signed.error, 'Não foi possível carregar o arquivo.');
    return new Response(null, { status: 307, headers: { Location: signed.data!.signedUrl, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  }
  const media = (await readLocalData()).media.find(item => item.id === id);
  if (!media || !/^[a-f0-9-]+\.(jpg|png|webp|mp4)$/.test(media.filename)) throw new HttpError(404, 'Arquivo não encontrado.');
  const location = path.join(localDirectory(), 'uploads', media.filename);
  const info = await stat(/* turbopackIgnore: true */ location).catch(() => null);
  if (!info) throw new HttpError(404, 'Arquivo não encontrado.');
  let start = 0; let end = info.size - 1; let status = 200;
  const range = request.headers.get('range');
  const responseHeaders: Record<string, string> = { 'Content-Type': media.mime, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': `inline; filename="${media.filename}"` };
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${info.size}` } });
    if (!match[1]) start = Math.max(info.size - Number(match[2]), 0);
    else { start = Number(match[1]); if (match[2]) end = Math.min(Number(match[2]), end); }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= info.size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${info.size}` } });
    status = 206; responseHeaders['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
  }
  responseHeaders['Content-Length'] = String(end - start + 1);
  if (request.method === 'HEAD') return new Response(null, { status, headers: responseHeaders });
  const stream = Readable.toWeb(createReadStream(/* turbopackIgnore: true */ location, { start, end }));
  return new Response(stream as ReadableStream<Uint8Array>, { status, headers: responseHeaders });
}
