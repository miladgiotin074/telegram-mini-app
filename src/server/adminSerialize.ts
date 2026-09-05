import type { AdminAccountSummary } from '@/lib/adminTypes';

export function toIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string' && value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  return '';
}

export function toAdminAccountSummary(user: {
  telegramId: number;
  firstName?: string | null;
  username?: string | null;
  photoUrl?: string | null;
  mtprotoPhone?: string | null;
  mtprotoUsername?: string | null;
  mtprotoUserId?: number | null;
  isVerified?: boolean | null;
  contactCount?: number | null;
  mutualContactCount?: number | null;
  contactsSyncedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}): AdminAccountSummary {
  const synced = Boolean(user.contactsSyncedAt);
  return {
    telegramId: user.telegramId,
    firstName: user.firstName || '',
    username: user.username || '',
    photoUrl: user.photoUrl || '',
    phone: user.mtprotoPhone || '',
    mtprotoUsername: user.mtprotoUsername || '',
    mtprotoUserId: user.mtprotoUserId ?? null,
    isVerified: Boolean(user.isVerified),
    contactCount: synced ? user.contactCount ?? 0 : null,
    mutualContactCount: synced ? user.mutualContactCount ?? 0 : null,
    createdAt: toIso(user.createdAt),
    updatedAt: toIso(user.updatedAt),
  };
}
