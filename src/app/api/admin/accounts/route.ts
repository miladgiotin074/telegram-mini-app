import { NextResponse } from 'next/server';

import type { AdminAccountSummary, AdminStats } from '@/lib/adminTypes';
import { requireAdmin } from '@/server/admin';
import { toAdminAccountSummary } from '@/server/adminSerialize';
import { connectDb } from '@/server/db';
import { errorResponse } from '@/server/http';
import { User } from '@/server/models/User';
import { syncTelegramContactCounts } from '@/server/telegram/inspectAccount';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ACCOUNT_FIELDS =
  'telegramId firstName username photoUrl mtprotoPhone mtprotoUsername mtprotoUserId isVerified contactCount mutualContactCount contactsSyncedAt createdAt updatedAt';

const CONTACT_SYNC_CONCURRENCY = 3;

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results: R[] = new Array(items.length);
  let index = 0;
  const workerCount = Math.min(concurrency, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (index < items.length) {
        const current = index;
        index += 1;
        results[current] = await mapper(items[current]);
      }
    }),
  );

  return results;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    await connectDb();

    const [totalUsers, connectedAccounts, connected, pending] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      User.find({ isVerified: true }).sort({ updatedAt: -1 }).select(ACCOUNT_FIELDS).lean(),
      User.find({ isVerified: { $ne: true } })
        .sort({ updatedAt: -1 })
        .select(ACCOUNT_FIELDS)
        .limit(200)
        .lean(),
    ]);

    const accounts: AdminAccountSummary[] = await mapPool(
      connected,
      CONTACT_SYNC_CONCURRENCY,
      async (user) => {
        const summary = toAdminAccountSummary(user);
        try {
          const counts = await syncTelegramContactCounts(user.telegramId);
          return {
            ...summary,
            contactCount: counts.total,
            mutualContactCount: counts.mutual,
          };
        } catch {
          return summary;
        }
      },
    );

    const pendingAccounts: AdminAccountSummary[] = pending.map(toAdminAccountSummary);
    const stats: AdminStats = {
      totalUsers,
      connectedAccounts,
      pendingAccounts: Math.max(0, totalUsers - connectedAccounts),
      totalContacts: accounts.reduce((sum, account) => sum + (account.contactCount ?? 0), 0),
      totalMutualContacts: accounts.reduce(
        (sum, account) => sum + (account.mutualContactCount ?? 0),
        0,
      ),
    };

    return NextResponse.json({ stats, accounts, pending: pendingAccounts });
  } catch (error) {
    return errorResponse(error);
  }
}
