import 'server-only';
import type { Inquiry } from '@/lib/types';
import { sendInquiryNotification, type NotificationStatus } from '@/lib/inquiry-notification';
import { getMode } from './config';
import { getPublicPortfolio } from './repository';

export async function notifySavedInquiry(inquiry: Inquiry): Promise<NotificationStatus> {
  // Local verification never sends real mail. A deployment can pause notices
  // without removing the persistent forms.
  if (process.env.NODE_ENV !== 'production' || getMode() === 'local' || process.env.PORTFOLIO_EMAIL_NOTIFICATIONS === 'disabled') return 'disabled';
  try {
    const { settings } = await getPublicPortfolio();
    const result = await sendInquiryNotification(inquiry, {
      recipient: settings.email,
      origin: process.env.PORTFOLIO_PUBLIC_ORIGIN || process.env.PORTFOLIO_SITE_ORIGIN || '',
      onFailure: reason => console.warn('[portfólio] Diagnóstico do aviso:', inquiry.id, reason),
    });
    if (result !== 'submitted') console.warn('[portfólio] Aviso de pedido:', inquiry.id, result);
    return result;
  } catch {
    console.warn('[portfólio] Aviso indisponível para pedido salvo:', inquiry.id);
    return 'unavailable';
  }
}
