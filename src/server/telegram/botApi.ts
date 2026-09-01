const TELEGRAM_API = 'https://api.telegram.org';

type TelegramApiResult = {
  ok: boolean;
  description?: string;
  result?: unknown;
};

function botToken(): string {
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();

  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }

  return token;
}

export async function callTelegramApi(
  method: string,
  body: Record<string, unknown>,
): Promise<TelegramApiResult> {
  const response = await fetch(`${TELEGRAM_API}/bot${botToken()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as TelegramApiResult;

  if (!data.ok) {
    console.error(`Telegram ${method} failed:`, data.description || data);
  }

  return data;
}
