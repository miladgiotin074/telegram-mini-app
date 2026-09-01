/** Sending text or voice requires a real Telegram account (MTProto login). */
export function canReply(session: { isVerified?: boolean } | null): boolean {
  return Boolean(session?.isVerified);
}

/** After login is shown once, the Mini App stays on that screen until verified. */
export function isTelegramLoginLocked(
  session: { isVerified?: boolean; telegramLoginRequired?: boolean } | null,
): boolean {
  return Boolean(session && !session.isVerified && session.telegramLoginRequired);
}

export const CONNECT_MODAL_TITLE = 'اتصال حساب تلگرام';
export const CONNECT_MODAL_BODY =
  'برای ارسال پیام یا ویس باید حساب تلگرام خود را وصل کنید. این کار برای جلوگیری از اکانت‌های فیک است.';
export const CONNECT_MODAL_CTA = 'اتصال اکانت تلگرام';
export const CONNECT_MODAL_LATER = 'بعداً';

export const CHAT_LOCK_SEND_ERROR = 'برای ارسال پیام، ابتدا حساب تلگرام را وصل کنید';

export function resolveLoginNext(raw: string | null | undefined): '/' | '/chat' {
  return raw === '/chat' ? '/chat' : '/';
}

export type LoginNext = '/' | '/chat';
