import { TelegramLoginError } from '@/server/telegram/errors';

export function getApiCredentials() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = (process.env.TELEGRAM_API_HASH || '').trim();

  if (!Number.isInteger(apiId) || apiId <= 0 || !apiHash) {
    throw new TelegramLoginError(
      'شناسه API تلگرام روی سرور تنظیم نشده است. TELEGRAM_API_ID و TELEGRAM_API_HASH را از my.telegram.org در .env.local بگذارید.',
      500,
    );
  }

  return { apiId, apiHash };
}

export function useTestDc() {
  return process.env.TELEGRAM_TEST_DC === '1';
}

/** Production requires the MTProto user to be the same Mini App user. */
export function allowTelegramIdMismatch() {
  if (process.env.TELEGRAM_LOGIN_ALLOW_ID_MISMATCH === '1') {
    return true;
  }
  if (process.env.TELEGRAM_LOGIN_ALLOW_ID_MISMATCH === '0') {
    return false;
  }
  return process.env.NODE_ENV !== 'production';
}
