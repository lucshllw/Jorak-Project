import 'server-only';
import { headers } from 'next/headers';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function getMode(): 'local' | 'supabase' {
  const configured = process.env.PORTFOLIO_MODE;
  if (configured && configured !== 'local' && configured !== 'supabase') throw new HttpError(503, 'Modo de armazenamento inválido.');
  const mode: 'local' | 'supabase' = (configured as 'local' | 'supabase' | undefined) || (process.env.NODE_ENV === 'production' ? 'supabase' : 'local');
  if (mode === 'local' && process.env.NODE_ENV === 'production') throw new HttpError(503, 'O armazenamento local é exclusivo para desenvolvimento. Configure o Supabase para produção.');
  return mode;
}

export function isLocalPreview() { return getMode() === 'local' && process.env.PORTFOLIO_LOCAL_PREVIEW === 'true'; }

export function isLoopbackHost(host: string): boolean {
  try {
    const url = new URL(`http://${host}`);
    return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname.toLowerCase()) && !url.username && !url.password && url.pathname === '/';
  } catch { return false; }
}

export function guardRequest(request: Request): void {
  if (getMode() === 'local' && (!isLoopbackHost(request.headers.get('host') || '') || !isLoopbackHost(new URL(request.url).host))) {
    throw new HttpError(403, 'A versão local só pode ser acessada neste computador.');
  }
}

export async function guardServerRequest() {
  if (getMode() === 'local') {
    const requestHeaders = await headers();
    if (!isLoopbackHost(requestHeaders.get('host') || '')) throw new HttpError(403, 'A prévia local só pode ser acessada neste computador.');
  }
}

export function assertSameOrigin(request: Request): void {
  guardRequest(request);
  const origin = request.headers.get('origin');
  const configured = process.env.PORTFOLIO_SITE_ORIGIN;
  // A preview can move to another local port when the preferred port is occupied.
  // guardRequest already restricts local mode to loopback; production stays pinned.
  const expected = getMode() === 'local' ? `${new URL(request.url).protocol}//${request.headers.get('host')}` : configured ? new URL(configured).origin : new URL(request.url).origin;
  if (process.env.NODE_ENV === 'production' && !configured) throw new HttpError(503, 'Configure a origem pública do portfólio.');
  // Escritas públicas exigem a origem do próprio site, inclusive sem cookies.
  if (!origin || origin !== expected || request.headers.get('sec-fetch-site') === 'cross-site') throw new HttpError(403, 'Esta solicitação precisa ser feita pelo próprio portfólio.');
}
