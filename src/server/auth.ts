import { parse, validate } from '@tma.js/init-data-node';

import { connectDb } from '@/server/db';
import { User, type UserDoc } from '@/server/models/User';

export class AuthError extends Error {
  readonly status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

const INIT_DATA_TTL_SECONDS = 3600;

function extractInitData(request: Request): string {
  const header = request.headers.get('authorization') || '';
  const [scheme, value] = header.split(' ');

  if (scheme !== 'tma' || !value) {
    throw new AuthError('Missing Telegram init data');
  }

  return value;
}

/**
 * Verifies that the caller really comes from Telegram. Without a valid,
 * bot-token-signed signature the request is rejected, which is what keeps
 * fabricated users out of the API.
 */
function verifiedTelegramUser(initDataRaw: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (botToken) {
    validate(initDataRaw, botToken, { expiresIn: INIT_DATA_TTL_SECONDS });
  } else if (process.env.NODE_ENV === 'production') {
    throw new AuthError('TELEGRAM_BOT_TOKEN is not configured', 500);
  } else {
    // Local development uses mocked init data, which carries no real signature.
    console.warn('TELEGRAM_BOT_TOKEN is unset — init data signature is not verified.');
  }

  const parsed = parse(initDataRaw);

  if (!parsed.user) {
    throw new AuthError('Init data carries no user');
  }

  return parsed.user;
}

/** Resolves the current user, creating the record on first visit. */
export async function requireUser(request: Request): Promise<UserDoc> {
  let telegramUser;

  try {
    telegramUser = verifiedTelegramUser(extractInitData(request));
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError('Invalid Telegram init data');
  }

  await connectDb();

  const user = await User.findOneAndUpdate(
    { telegramId: telegramUser.id },
    {
      $set: {
        firstName: telegramUser.first_name || '',
        username: telegramUser.username || '',
        languageCode: telegramUser.language_code || '',
        photoUrl: telegramUser.photo_url || '',
      },
      $setOnInsert: { telegramId: telegramUser.id },
    },
    { upsert: true, returnDocument: 'after' },
  ).lean<UserDoc>();

  if (!user) {
    throw new AuthError('Could not resolve the user', 500);
  }

  return user;
}
