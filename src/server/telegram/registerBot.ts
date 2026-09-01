import { callTelegramApi } from '@/server/telegram/botApi';
import { publicAppUrl } from '@/server/telegram/publicUrl';
import { telegramWebhookSecret } from '@/server/telegram/webhookSecret';

function isNextBuildProcess(): boolean {
  return process.argv.includes('build') || process.env['npm_lifecycle_event'] === 'build';
}

/**
 * Points Telegram at this host: /start webhook, bot commands, and the Mini App menu button.
 * Safe to call on every Render boot; does not drop pending updates.
 */
export async function registerTelegramBotInfra(): Promise<void> {
  if (isNextBuildProcess() || process.env.NODE_ENV !== 'production') {
    return;
  }

  if (!(process.env.TELEGRAM_BOT_TOKEN || '').trim()) {
    console.warn('Skipping Telegram webhook setup: TELEGRAM_BOT_TOKEN is missing.');
    return;
  }

  const appUrl = publicAppUrl();
  const secret = telegramWebhookSecret();

  if (!appUrl || !secret) {
    console.warn(
      'Skipping Telegram webhook setup: need TELEGRAM_MINI_APP_URL or RENDER_EXTERNAL_URL.',
    );
    return;
  }

  const webhookUrl = (
    process.env.TELEGRAM_WEBHOOK_URL || `${appUrl}/api/bot`
  ).trim();

  const webhook = await callTelegramApi('setWebhook', {
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ['message'],
  });

  if (!webhook.ok) {
    return;
  }

  await callTelegramApi('setMyCommands', {
    commands: [{ command: 'start', description: 'خوش‌آمدگویی و باز کردن اپ' }],
  });

  await callTelegramApi('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'دوست‌یابی',
      web_app: { url: appUrl },
    },
  });

  console.log(`Telegram webhook registered: ${webhookUrl}`);
}
