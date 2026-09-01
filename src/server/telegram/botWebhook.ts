import { timingSafeEqual } from 'node:crypto';

import { publicAppUrlFromRequest } from '@/server/telegram/publicUrl';
import { sendStartWelcome } from '@/server/telegram/startWelcome';
import { telegramWebhookSecret } from '@/server/telegram/webhookSecret';

type TelegramChat = {
  id: number;
  type?: string;
};

type TelegramFrom = {
  first_name?: string;
};

type TelegramMessage = {
  text?: string;
  chat?: TelegramChat;
  from?: TelegramFrom;
};

export type TelegramUpdate = {
  message?: TelegramMessage;
};

function secretsEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

export function verifyTelegramWebhook(request: Request): boolean {
  const expected = telegramWebhookSecret();
  const received = request.headers.get('x-telegram-bot-api-secret-token') || '';

  if (!expected) {
    return process.env.NODE_ENV !== 'production';
  }

  return secretsEqual(expected, received);
}

export function resolveMiniAppUrl(request: Request): string | null {
  return publicAppUrlFromRequest(request);
}

function isStartCommand(text: string | undefined): boolean {
  if (!text) {
    return false;
  }

  return /^\/start(?:@[\w_]+)?(?:\s|$)/i.test(text.trim());
}

export async function handleBotUpdate(update: TelegramUpdate, miniAppUrl: string | null): Promise<void> {
  const message = update.message;

  if (!message || message.chat?.type !== 'private' || !isStartCommand(message.text)) {
    return;
  }

  const chatId = message.chat?.id;

  if (!chatId) {
    return;
  }

  await sendStartWelcome(chatId, message.from?.first_name || 'دوست', miniAppUrl);
}
