import { TelegramLoginError } from '@/server/telegram/errors';
import { sessions, TelegramClient } from '@/server/telegram/teleproto';
import { getApiCredentials, useTestDc } from '@/server/telegram/credentials';

type SessionLike = {
  save?: () => unknown;
  authKey?: { waitForKey?: () => Promise<void> };
};

function readSessionString(session?: SessionLike | null): string {
  if (!session || typeof session.save !== 'function') {
    return '';
  }
  const saved = session.save();
  return typeof saved === 'string' && saved.length > 1 ? saved : '';
}

/**
 * StringSession.save() can return "" if the auth key is not readable yet
 * (DC switch, async key setup). The in-memory attempt session from sendCode
 * is the fallback used when persisting a successful login.
 */
export async function exportSessionString(
  session: SessionLike,
  client?: { session?: SessionLike },
): Promise<string> {
  let value = readSessionString(client?.session) || readSessionString(session);
  if (value) {
    return value;
  }

  const key = session.authKey ?? client?.session?.authKey;
  if (key && typeof key.waitForKey === 'function') {
    try {
      await key.waitForKey();
    } catch {
      return '';
    }
    value = readSessionString(client?.session) || readSessionString(session);
  }
  return value;
}

export function pickSessionString(...candidates: Array<string | undefined | null>): string {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 1) {
      return candidate;
    }
  }
  return '';
}

export async function withTelegramClient<T>(
  sessionString: string,
  fn: (client: TelegramClient) => Promise<T>,
): Promise<{ result: T; sessionString: string }> {
  const { apiId, apiHash } = getApiCredentials();
  // Must come from the same `teleproto` module as TelegramClient. A subpath
  // import (`teleproto/sessions`) can be bundled separately by Next.js, which
  // breaks `instanceof Session` inside the library.
  const session = new sessions.StringSession(sessionString);
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 3,
    autoReconnect: false,
    floodSleepThreshold: 0,
    timeout: 20,
    retryDelay: 1000,
    testServers: useTestDc(),
    deviceModel: 'Telegram Mini App',
    systemVersion: 'Web',
    appVersion: '1.0',
    langCode: 'fa',
    systemLangCode: 'fa',
  });

  try {
    await client.connect();
    try {
      const result = await fn(client);
      const exported = await exportSessionString(session, client);
      return { result, sessionString: pickSessionString(exported, sessionString) };
    } catch (error) {
      const saved = await exportSessionString(session, client);
      const next = pickSessionString(saved, sessionString);
      if (error instanceof TelegramLoginError) {
        error.sessionString = next;
      } else if (error && typeof error === 'object') {
        (error as { sessionString?: string }).sessionString = next;
      }
      throw error;
    }
  } finally {
    try {
      await client.disconnect();
    } catch {
      // The request already finished; a disconnect failure must not hide it.
    }
  }
}
