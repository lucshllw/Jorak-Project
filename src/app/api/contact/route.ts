import { assertSameOrigin, HttpError } from '@/lib/server/config';
import { saveInquiry } from '@/lib/server/repository';
import { prepareSavedInquiryNotification } from '@/lib/server/inquiry-notification';
import { json, failure, readJson, rateLimit } from '@/lib/server/http';
import { inquirySchema, parse } from '@/lib/server/validation';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    assertSameOrigin(request); rateLimit(request, 'contact', 5, 10 * 60 * 1000);
    const { website, ...input } = parse(inquirySchema, await readJson(request, 16 * 1024));
    if (website) throw new HttpError(400, 'Não foi possível validar o formulário. Tente novamente.');
    const saved = await saveInquiry(input);
    const notification = await prepareSavedInquiryNotification(saved);
    return json({ saved: true, id: saved.id, ...notification }, 201);
  } catch (error) { return failure(error); }
}
