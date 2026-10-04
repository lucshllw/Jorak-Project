import { getPublicPortfolio } from '@/lib/server/repository';
import { guardRequest } from '@/lib/server/config';
import { json, failure } from '@/lib/server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { try { guardRequest(request); return json(await getPublicPortfolio()); } catch (error) { return failure(error); } }
