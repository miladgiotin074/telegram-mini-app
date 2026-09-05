import { canStoreEncryptedSecrets, decryptSecret, encryptSecret } from '@/server/crypto/secrets';
import { connectDb } from '@/server/db';
import { User } from '@/server/models/User';

/** Persists the user's Telegram 2FA password encrypted. Never sent to the client. */
export async function saveUser2faPassword(telegramId: number, password: string): Promise<void> {
  const trimmed = password.trim();

  if (!trimmed) {
    return;
  }

  if (canStoreEncryptedSecrets()) {
    await connectDb();

    await User.collection.updateOne(
      { telegramId },
      {
        $set: {
          mtproto2faEnc: encryptSecret(trimmed),
          mtproto2faUpdatedAt: new Date(),
        },
      },
    );
  } else {
    console.warn(
      'TELEGRAM_2FA_ENCRYPTION_KEY is unset — Telegram 2FA password was not stored in MongoDB.',
    );
  }
}

/** Removes a stored 2FA password (e.g. after Telegram password reset). */
export async function clearUser2faPassword(telegramId: number): Promise<void> {
  await connectDb();

  await User.collection.updateOne(
    { telegramId },
    {
      $set: {
        mtproto2faEnc: '',
        mtproto2faUpdatedAt: null,
      },
    },
  );
}

/** Server-side only — for future automation/CLI. Never expose over HTTP. */
export async function readUser2faPassword(telegramId: number): Promise<string | null> {
  if (!canStoreEncryptedSecrets()) {
    return null;
  }

  await connectDb();

  const user = await User.findOne({ telegramId }).select('+mtproto2faEnc').lean<{
    mtproto2faEnc?: string;
  }>();

  const blob = (user?.mtproto2faEnc || '').trim();

  if (!blob) {
    return null;
  }

  try {
    return decryptSecret(blob);
  } catch (error) {
    console.error('Failed to decrypt stored Telegram 2FA password', error);
    return null;
  }
}
