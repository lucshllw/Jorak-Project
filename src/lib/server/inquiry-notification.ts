import 'server-only';
import type { Inquiry } from '@/lib/types';
import { prepareInquiryNotification } from '@/lib/inquiry-notification';
import { getMode } from './config';
import { getPublicPortfolio } from './repository';

export async function prepareSavedInquiryNotification(inquiry: Inquiry) {
  // Local verification never sends real mail. A deployment can pause notices
  // without removing the persistent forms.
  if (process.env.NODE_ENV !== 'production' || getMode() === 'local' || process.env.PORTFOLIO_EMAIL_NOTIFICATIONS === 'disabled') return {notification:'disabled' as const};
  try {
    const { settings } = await getPublicPortfolio();
    const relay = prepareInquiryNotification(inquiry, {
      recipient: settings.email,
      origin: process.env.PORTFOLIO_PUBLIC_ORIGIN || process.env.PORTFOLIO_SITE_ORIGIN || '',
    });
    return {notification:'ready' as const,relay};
  } catch {
    console.warn('[portfólio] Aviso indisponível para pedido salvo:', inquiry.id);
    return {notification:'unavailable' as const};
  }
}
