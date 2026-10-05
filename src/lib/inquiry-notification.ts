import type { Inquiry } from './types';

export type NotificationStatus = 'submitted' | 'activation-required' | 'unavailable' | 'disabled';
type Configuration = { recipient: string; origin: string; onFailure?: (reason: string) => void };

// Transport only. Server callers supply the recipient from site settings, never
// from visitor input. A successful relay submission is not proof of inbox delivery.
export async function sendInquiryNotification(inquiry: Inquiry, config: Configuration, fetcher: typeof fetch = fetch): Promise<NotificationStatus> {
  const failed = (reason: string): NotificationStatus => { config.onFailure?.(reason); return 'unavailable'; };
  try {
    const origin = new URL(config.origin);
    if (origin.protocol !== 'https:' || origin.username || origin.password || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(config.recipient)) return 'unavailable';
    const product = Boolean(inquiry.productId);
    const formPath = product ? `/projetos-de-edicao/${encodeURIComponent(inquiry.productId!)}/contato` : '/contato';
    const response = await fetcher(`https://formsubmit.co/ajax/${encodeURIComponent(config.recipient)}`, {
      method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Referer: origin.origin + formPath },
      body: JSON.stringify({
        _subject: product ? 'JORAK — Arquivo de projeto: novo interesse' : 'JORAK — Orçamento: nova ideia',
        _template: 'table', _url: origin.origin + formPath,
        _replyto: inquiry.email, email: inquiry.email,
        'Nome': inquiry.name, 'Tipo de pedido': inquiry.type,
        'Duração': inquiry.duration, 'Prazo': inquiry.deadline,
        'Orçamento': inquiry.budget, 'Referências': inquiry.references,
        'Mensagem': inquiry.message, 'Código do pedido': inquiry.id,
        'Recebido em': inquiry.createdAt,
      }),
    });
    if (!response.ok) return failed(`http-${response.status}`);
    let result;
    try { result = await response.json(); } catch { return failed('non-json'); }
    if (typeof result.message === 'string' && /activat|ativação/i.test(result.message)) return 'activation-required';
    if (result.success === true || result.success === 'true') return 'submitted';
    return failed(typeof result.message === 'string' && /web server/i.test(result.message) ? 'source-missing' : 'provider-rejected');
  } catch (error) { return failed(error instanceof Error && /Timeout|Abort/.test(error.name) ? 'timeout' : 'network'); }
}
