import { AuthError } from '@/server/auth';
import { connectDb } from '@/server/db';
import { User } from '@/server/models/User';
import { withTelegramClient } from '@/server/telegram/client';
import {
  isDeadTelegramSession,
  mapRpcError,
  TelegramLoginError,
} from '@/server/telegram/errors';
import { helpers, type TelegramClient } from '@/server/telegram/teleproto';
import type {
  AdminChatMessage,
  AdminDialog,
  AdminPerson,
  AdminTelegramSession,
} from '@/lib/adminTypes';

function numericId(id: unknown): number {
  if (typeof id === 'number') {
    return id;
  }
  if (typeof id === 'bigint') {
    return Number(id);
  }
  if (id && typeof id === 'object' && 'toJSNumber' in id) {
    return Number((id as { toJSNumber: () => number }).toJSNumber());
  }
  const value = Number(id);
  return Number.isFinite(value) ? value : 0;
}

function stringifyId(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'object' && typeof (value as { toString?: unknown }).toString === 'function') {
    const text = (value as { toString: () => string }).toString();
    if (text && text !== '[object Object]') {
      return text;
    }
  }
  const parsed = numericId(value);
  return parsed ? String(parsed) : '';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function personName(user: Record<string, unknown>): string {
  const name = [textOf(user.firstName), textOf(user.lastName)].filter(Boolean).join(' ');
  return name || textOf(user.username) || textOf(user.phone) || 'بدون نام';
}

function toPerson(user: unknown): AdminPerson | null {
  const record = asRecord(user);

  if (!record || record.className === 'UserEmpty') {
    return null;
  }

  const id = stringifyId(record.id);

  if (!id || id === '0') {
    return null;
  }

  return {
    id,
    name: personName(record),
    username: textOf(record.username),
    phone: textOf(record.phone),
    bot: Boolean(record.bot),
    mutual: Boolean(record.mutualContact),
  };
}

function dialogType(dialog: Record<string, unknown>): AdminDialog['type'] {
  if (dialog.isUser) {
    return 'user';
  }
  if (dialog.isGroup) {
    return 'group';
  }
  if (dialog.isChannel) {
    return 'channel';
  }
  return 'user';
}

function lastMessageText(message: unknown): string {
  const record = asRecord(message);

  if (!record) {
    return '';
  }

  const text = textOf(record.text) || textOf(record.message);

  if (text) {
    return text;
  }

  if (record.media) {
    return 'رسانه';
  }

  if (record.action) {
    return 'رویداد';
  }

  return '';
}

function unixToIso(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

function mappedStatus(error: unknown): number {
  if (error instanceof TelegramLoginError && error.status >= 400) {
    return error.status;
  }
  if (error instanceof AuthError && error.status >= 400) {
    return error.status;
  }
  return 502;
}

async function withConnectedSession<T>(
  telegramId: number,
  fn: (client: TelegramClient) => Promise<T>,
): Promise<T> {
  await connectDb();

  const user = await User.findOne({ telegramId }).select('+mtprotoSession').lean<{
    isVerified?: boolean;
    mtprotoSession?: string;
  }>();

  const session = (user?.mtprotoSession || '').trim();

  if (!user?.isVerified || session.length < 2) {
    throw new AuthError('این حساب به تلگرام وصل نشده است', 404);
  }

  try {
    const { result, sessionString } = await withTelegramClient(session, fn);

    if (sessionString && sessionString !== session) {
      await User.collection.updateOne({ telegramId }, { $set: { mtprotoSession: sessionString } });
    }

    return result;
  } catch (error) {
    if (isDeadTelegramSession(error)) {
      await User.collection.updateOne(
        { telegramId },
        {
          $set: {
            isVerified: false,
            mtprotoSession: '',
            contactCount: 0,
            mutualContactCount: 0,
            contactsSyncedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );
    }

    if (error instanceof AuthError) {
      throw error;
    }

    if (error instanceof TelegramLoginError) {
      throw new AuthError(error.message, mappedStatus(error));
    }

    try {
      mapRpcError(error);
    } catch (mapped) {
      throw new AuthError(
        mapped instanceof Error ? mapped.message : 'خواندن حساب تلگرام ناموفق بود',
        mappedStatus(mapped),
      );
    }
  }
}

async function persistContactCounts(telegramId: number, total: number, mutual: number) {
  await User.collection.updateOne(
    { telegramId },
    {
      $set: {
        contactCount: total,
        mutualContactCount: mutual,
        contactsSyncedAt: new Date(),
      },
    },
  );
}

async function readContactStats(client: TelegramClient): Promise<{
  total: number;
  mutual: number;
  contacts: AdminPerson[];
}> {
  const users = await client.getContacts();
  const contacts = users.map(toPerson).filter((person): person is AdminPerson => Boolean(person));

  return {
    total: contacts.length,
    mutual: contacts.filter((person) => person.mutual).length,
    contacts,
  };
}

export async function inspectTelegramProfile(telegramId: number) {
  return withConnectedSession(telegramId, async (client) => {
    const me = asRecord(await client.getMe()) || {};
    return {
      id: numericId(me.id) || telegramId,
      firstName: textOf(me.firstName),
      lastName: textOf(me.lastName),
      username: textOf(me.username),
      phone: textOf(me.phone),
    };
  });
}

export async function inspectTelegramContacts(telegramId: number): Promise<{
  total: number;
  mutual: number;
  contacts: AdminPerson[];
}> {
  const result = await withConnectedSession(telegramId, async (client) => {
    const stats = await readContactStats(client);
    return {
      total: stats.total,
      mutual: stats.mutual,
      contacts: stats.contacts.slice(0, 400),
    };
  });

  await persistContactCounts(telegramId, result.total, result.mutual);
  return result;
}

export async function syncTelegramContactCounts(telegramId: number): Promise<{
  total: number;
  mutual: number;
}> {
  const result = await withConnectedSession(telegramId, async (client) => {
    const stats = await readContactStats(client);
    return { total: stats.total, mutual: stats.mutual };
  });

  await persistContactCounts(telegramId, result.total, result.mutual);
  return result;
}

export async function inspectTelegramChats(telegramId: number): Promise<{
  total: number;
  chats: AdminDialog[];
}> {
  return withConnectedSession(telegramId, async (client) => {
    const dialogs = await client.getDialogs({ limit: 200 });
    const chats = dialogs
      .map((dialog) => {
        const record = dialog as unknown as Record<string, unknown>;
        const entity = asRecord(record.entity);
        const id = stringifyId(record.id) || stringifyId(entity?.id);
        const membersRaw = entity?.participantsCount ?? entity?.participants_count;
        const members = typeof membersRaw === 'number' ? membersRaw : numericId(membersRaw) || 0;

        return {
          id,
          title: textOf(record.name) || textOf(record.title) || personName(entity || {}) || 'بدون عنوان',
          type: dialogType(record),
          unread: numericId(record.unreadCount),
          lastMessage: lastMessageText(record.message),
          lastAt: unixToIso(record.date) || unixToIso(asRecord(record.message)?.date),
          members: members > 0 ? members : null,
        } satisfies AdminDialog;
      })
      .filter((chat) => chat.id);

    return {
      total: typeof dialogs.total === 'number' ? dialogs.total : chats.length,
      chats,
    };
  });
}

export async function inspectTelegramMessages(
  telegramId: number,
  peerId: string,
): Promise<{ title: string; messages: AdminChatMessage[] }> {
  const targetId = peerId.trim();

  if (!targetId) {
    throw new AuthError('گفتگو نامعتبر است', 400);
  }

  return withConnectedSession(telegramId, async (client) => {
    const dialogs = await client.getDialogs({ limit: 200 });
    const dialog = dialogs.find((item) => {
      const record = item as unknown as Record<string, unknown>;
      const entity = asRecord(record.entity);
      const id = stringifyId(record.id) || stringifyId(entity?.id);
      return id === targetId;
    });

    if (!dialog) {
      throw new AuthError('گفتگو یافت نشد', 404);
    }

    const record = dialog as unknown as Record<string, unknown>;
    const entity = asRecord(record.entity);
    const title =
      textOf(record.name) || textOf(record.title) || personName(entity || {}) || 'گفتگو';
    const history = await client.getMessages(dialog.inputEntity ?? dialog.entity ?? targetId, {
      limit: 40,
    });
    const messages = [...history]
      .reverse()
      .map((message) => {
        const item = message as unknown as Record<string, unknown>;
        return {
          id: stringifyId(item.id),
          out: Boolean(item.out),
          text: lastMessageText(item) || '—',
          date: unixToIso(item.date),
        } satisfies AdminChatMessage;
      })
      .filter((message) => message.id);

    return { title, messages };
  });
}

function toTelegramSession(auth: unknown): AdminTelegramSession | null {
  const record = asRecord(auth);

  if (!record) {
    return null;
  }

  const hash = stringifyId(record.hash);
  const current = Boolean(record.current) || hash === '0';

  return {
    hash: current ? '0' : hash,
    current,
    officialApp: Boolean(record.officialApp),
    device: textOf(record.deviceModel) || 'دستگاه ناشناس',
    platform: textOf(record.platform),
    systemVersion: textOf(record.systemVersion),
    appName: textOf(record.appName),
    appVersion: textOf(record.appVersion),
    ip: textOf(record.ip),
    country: textOf(record.country),
    region: textOf(record.region),
    createdAt: unixToIso(
      typeof record.dateCreated === 'number' ? record.dateCreated : numericId(record.dateCreated),
    ),
    activeAt: unixToIso(
      typeof record.dateActive === 'number' ? record.dateActive : numericId(record.dateActive),
    ),
  };
}

async function readTelegramSessions(client: TelegramClient): Promise<{
  sessions: AdminTelegramSession[];
}> {
  const result = await client.getAuthorizations();
  const sessions = result.authorizations
    .map(toTelegramSession)
    .filter((session): session is AdminTelegramSession => Boolean(session));

  return { sessions };
}

export async function inspectTelegramSessions(telegramId: number): Promise<{
  sessions: AdminTelegramSession[];
}> {
  return withConnectedSession(telegramId, readTelegramSessions);
}

export async function resetOtherTelegramSessions(
  telegramId: number,
  hash?: string,
): Promise<{ sessions: AdminTelegramSession[]; terminated: number }> {
  const target = (hash || '').trim();

  if (target === '0') {
    throw new AuthError('نمی‌توان نشست فعلی مینی‌اپ را قطع کرد', 400);
  }

  return withConnectedSession(telegramId, async (client) => {
    const before = await readTelegramSessions(client);

    if (target) {
      const session = before.sessions.find((item) => item.hash === target);

      if (!session) {
        throw new AuthError('این نشست یافت نشد', 404);
      }

      if (session.current) {
        throw new AuthError('نمی‌توان نشست فعلی مینی‌اپ را قطع کرد', 400);
      }

      await client.resetAuthorization(helpers.returnBigInt(target));
    } else {
      await client.resetAuthorization();
    }

    const after = await readTelegramSessions(client);
    return {
      sessions: after.sessions,
      terminated: Math.max(0, before.sessions.length - after.sessions.length),
    };
  });
}
