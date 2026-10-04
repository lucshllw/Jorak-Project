import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { HttpError } from './config';

function configuration() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new HttpError(503, 'O Supabase ainda não está conectado. Configure URL e chave publicável no servidor.');
  try { if (new URL(url).protocol !== 'https:') throw new Error(); } catch { throw new HttpError(503, 'A URL do Supabase precisa usar HTTPS.'); }
  return { url, publishableKey };
}
export function publicSupabase() {
  const { url, publishableKey } = configuration();
  return createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
export function serviceSupabase() {
  const { url } = configuration();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new HttpError(503, 'Configure a chave secreta do Supabase no servidor.');
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
export function databaseError(error: { code?: string; message?: string } | null, fallback = 'Não foi possível salvar no banco. Tente novamente.') {
  if (!error) return;
  if (error.code === '23505') throw new HttpError(409, 'Este endereço ou nome já está cadastrado.');
  if (error.code === '23503') throw new HttpError(409, 'Confira os artistas associados ao projeto.');
  if (error.code === '42501') throw new HttpError(403, 'Sua conta não está autorizada para esta operação.');
  throw new HttpError(503, fallback);
}
