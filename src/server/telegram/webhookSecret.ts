import { createHash } from 'node:crypto';

const SECRET_PATTERN = /^[A-Za-z0-9_-]{1,256}$/;

/**
 * Telegram only accepts A-Z a-z 0-9 _ - in webhook secrets.
 * If TELEGRAM_WEBHOOK_SECRET is unset or invalid, derive a stable hex from the bot token
 * so Render deploys do not need a second secret.
 */
export function telegramWebhookSecret(): string {
  const explicit = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();

  if (SECRET_PATTERN.test(explicit)) {
    return explicit;
  }

  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();

  if (!token) {
    return '';
  }

  return createHash('sha256').update(`webhook:${token}`).digest('hex').slice(0, 48);
}
