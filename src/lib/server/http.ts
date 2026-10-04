import 'server-only';
import { NextResponse } from 'next/server';
import { HttpError, guardRequest } from './config';

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export function failure(error: unknown) {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  console.error('[portfólio] Uma operação do servidor falhou.');
  return json({ error: 'Não foi possível concluir a operação. Tente novamente.' }, 500);
}
export async function limitedBytes(request: Request, maximum: number): Promise<Buffer> {
  const length = request.headers.get('content-length');
  if (length && (Number(length) > maximum || !Number.isFinite(Number(length)))) throw new HttpError(413, 'Este conteúdo excede o limite de envio.');
  if (!request.body) throw new HttpError(400, 'O conteúdo da solicitação está vazio.');
  const reader = request.body.getReader();
  const parts: Buffer[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) { await reader.cancel(); throw new HttpError(413, 'Este conteúdo excede o limite de envio.'); }
      parts.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(parts);
}
export async function readJson(request: Request, maximum = 256 * 1024): Promise<unknown> {
  guardRequest(request);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'Envie os dados no formato JSON.');
  try { return JSON.parse((await limitedBytes(request, maximum)).toString('utf8')); }
  catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, 'Os dados enviados não são válidos.'); }
}
type Window = { count: number; expires: number };
const globalLimit = globalThis as typeof globalThis & { jorakRateLimits?: Map<string, Window> };
export function rateLimit(request: Request, category: string, maximum: number, milliseconds: number) {
  guardRequest(request);
  const map = globalLimit.jorakRateLimits ||= new Map();
  const forwarded = process.env.VERCEL || process.env.PORTFOLIO_TRUST_PROXY === 'true' ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() : null;
  const identity = forwarded || 'shared';
  const key = `${category}:${identity}`;
  const now = Date.now();
  if (map.size > 10000) for (const [entry, window] of map) if (window.expires < now) map.delete(entry);
  if (map.size > 20000) throw new HttpError(429, 'Muitas solicitações. Aguarde um pouco e tente novamente.');
  const window = map.get(key);
  if (!window || window.expires < now) { map.set(key, { count: 1, expires: now + milliseconds }); return; }
  if (window.count >= maximum) throw new HttpError(429, 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
  window.count++;
}
