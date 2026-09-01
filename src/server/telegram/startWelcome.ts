import { callTelegramApi } from '@/server/telegram/botApi';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function startWelcomeHtml(firstName: string): string {
  const name = escapeHtml(firstName.trim() || 'دوست');

  return [
    `سلام <b>${name}</b> 👋`,
    '',
    'به <b>دوست‌یابی</b> خوش آمدی — مینی‌اپ آشنایی روی تلگرام، برای پیدا کردن آدم واقعی، همین حالا.',
    '',
    '<b>اینجا چه کار می‌کنی؟</b>',
    '• <b>آدم واقعی</b> — کسی را پیدا کن که آنلاین است و می‌خواهد حرف بزند',
    '• <b>چت و ویس</b> — پیام بفرست یا ویس بگذار؛ بدون سانسور و رودربایستی',
    '• <b>فقط بین خودتان</b> — گفتگوهایت محرمانه می‌ماند',
    '',
    '<blockquote>ورود یعنی تأیید می‌کنی بالای ۱۸ سال هستی.</blockquote>',
    '',
    'برای شروع، دکمه شیشه‌ای زیر را بزن تا مینی‌اپ باز شود.',
  ].join('\n');
}

export function miniAppOpenMarkup(miniAppUrl: string) {
  return {
    inline_keyboard: [
      [
        {
          text: 'باز کردن اپ',
          web_app: { url: miniAppUrl },
        },
      ],
    ],
  };
}

export async function sendStartWelcome(
  chatId: number,
  firstName: string,
  miniAppUrl: string | null,
): Promise<void> {
  const replyMarkup = miniAppUrl ? miniAppOpenMarkup(miniAppUrl) : undefined;

  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text: startWelcomeHtml(firstName),
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });

  if (!miniAppUrl) {
    console.error('TELEGRAM_MINI_APP_URL is missing; /start was sent without the Mini App button.');
    return;
  }

  await callTelegramApi('setChatMenuButton', {
    chat_id: chatId,
    menu_button: {
      type: 'web_app',
      text: 'دوست‌یابی',
      web_app: { url: miniAppUrl },
    },
  });
}
