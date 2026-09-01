/**
 * Registers this app as the bot webhook and sets the default Mini App menu button.
 * On Render this also runs automatically when the server starts.
 * Usage (from project root):
 *   node scripts/set-telegram-webhook.mjs
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFiles() {
  for (const file of ['.env.local', '.env.production', '.env']) {
    const path = resolve(process.cwd(), file);

    if (!existsSync(path)) {
      continue;
    }

    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const eq = trimmed.indexOf('=');

      if (eq < 1) {
        continue;
      }

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFiles();

function webhookSecret(token) {
  const explicit = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();

  if (/^[A-Za-z0-9_-]{1,256}$/.test(explicit)) {
    return explicit;
  }

  return createHash('sha256').update(`webhook:${token}`).digest('hex').slice(0, 48);
}

const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const miniAppUrl = (
  process.env.TELEGRAM_MINI_APP_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  ''
)
  .trim()
  .replace(/\/+$/, '');
const webhookUrl = (
  process.env.TELEGRAM_WEBHOOK_URL || (miniAppUrl ? `${miniAppUrl}/api/bot` : '')
).trim();
const secret = token ? webhookSecret(token) : '';

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is missing.');
  process.exit(1);
}

if (!webhookUrl.startsWith('https://')) {
  console.error('Set TELEGRAM_WEBHOOK_URL or TELEGRAM_MINI_APP_URL to an https URL.');
  process.exit(1);
}

async function telegram(method, body) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  if (!data.ok) {
    throw new Error(`${method}: ${data.description || JSON.stringify(data)}`);
  }

  return data.result;
}

const webhook = await telegram('setWebhook', {
  url: webhookUrl,
  secret_token: secret,
  allowed_updates: ['message'],
  drop_pending_updates: true,
});

const commands = await telegram('setMyCommands', {
  commands: [{ command: 'start', description: 'خوش‌آمدگویی و باز کردن اپ' }],
});

let menu = null;

if (miniAppUrl.startsWith('https://')) {
  menu = await telegram('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'دوست‌یابی',
      web_app: { url: miniAppUrl },
    },
  });
}

console.log('Webhook:', webhookUrl, webhook);
console.log('Commands:', commands);
console.log('Menu button:', menu ?? 'skipped (set TELEGRAM_MINI_APP_URL)');
