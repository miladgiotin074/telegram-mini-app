import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const PREFIX = 'v1:';

function encryptionKey(): Buffer {
  const secret = (process.env.TELEGRAM_2FA_ENCRYPTION_KEY || '').trim();

  if (!secret) {
    throw new Error('TELEGRAM_2FA_ENCRYPTION_KEY is not configured');
  }

  return createHash('sha256').update(secret, 'utf8').digest();
}

/** True when encrypted 2FA passwords can be written to MongoDB. */
export function canStoreEncryptedSecrets(): boolean {
  return Boolean((process.env.TELEGRAM_2FA_ENCRYPTION_KEY || '').trim());
}

/** Encrypts a short secret (e.g. Telegram 2FA password) for storage at rest. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, ciphertext]).toString('base64url');

  return `${PREFIX}${payload}`;
}

/** Decrypts a value produced by {@link encryptSecret}. */
export function decryptSecret(ciphertext: string): string {
  const trimmed = ciphertext.trim();

  if (!trimmed.startsWith(PREFIX)) {
    throw new Error('Unsupported secret ciphertext format');
  }

  const raw = Buffer.from(trimmed.slice(PREFIX.length), 'base64url');

  if (raw.length < IV_BYTES + 16 + 1) {
    throw new Error('Secret ciphertext is too short');
  }

  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(IV_BYTES, IV_BYTES + 16);
  const encrypted = raw.subarray(IV_BYTES + 16);
  const decipher = createDecipheriv(ALGO, encryptionKey(), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
