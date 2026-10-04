import { serveMedia } from '@/lib/server/media';
import { failure } from '@/lib/server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function handle(request: Request, context: { params: Promise<{ id: string }> }) { try { return await serveMedia(request, (await context.params).id); } catch (error) { return failure(error); } }
export const GET = handle;
export const HEAD = handle;
