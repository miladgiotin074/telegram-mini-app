import { NextResponse } from 'next/server';

import type { AdminAccountDetail, AdminLiveProfile } from '@/lib/adminTypes';
import { requireAdmin } from '@/server/admin';
import { toIso } from '@/server/adminSerialize';
import { connectDb } from '@/server/db';
import { errorResponse } from '@/server/http';
import { User } from '@/server/models/User';
import { inspectTelegramProfile, syncTelegramContactCounts } from '@/server/telegram/inspectAccount';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ telegramId: string }> },
) {
  try {
    await requireAdmin(request);
    const telegramId = Number((await params).telegramId);

    if (!Number.isInteger(telegramId) || telegramId <= 0) {
      return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 });
    }

    await connectDb();

    const user = await User.findOne({ telegramId }).lean();

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    let live: AdminLiveProfile | null = null;
    let liveError: string | null = null;
    let contactCount = user.contactsSyncedAt ? user.contactCount ?? 0 : null;
    let mutualContactCount = user.contactsSyncedAt ? user.mutualContactCount ?? 0 : null;

    if (user.isVerified) {
      try {
        live = await inspectTelegramProfile(telegramId);
      } catch (error) {
        liveError = error instanceof Error ? error.message : 'خواندن تلگرام ناموفق بود';
      }

      try {
        const counts = await syncTelegramContactCounts(telegramId);
        contactCount = counts.total;
        mutualContactCount = counts.mutual;
      } catch {
        // Keep last stored counts when the live contact list cannot be read.
      }
    }

    const account: AdminAccountDetail = {
      telegramId: user.telegramId,
      firstName: user.firstName || '',
      username: user.username || '',
      photoUrl: user.photoUrl || '',
      languageCode: user.languageCode || '',
      gender: user.gender || null,
      isAdultConfirmed: Boolean(user.isAdultConfirmed),
      isVerified: Boolean(user.isVerified),
      phone: user.mtprotoPhone || live?.phone || '',
      mtprotoUsername: user.mtprotoUsername || live?.username || '',
      mtprotoUserId: user.mtprotoUserId ?? live?.id ?? null,
      posts: user.posts?.length ?? 0,
      matchedProfileSlug: user.matchedProfileSlug || null,
      contactCount,
      mutualContactCount,
      createdAt: toIso(user.createdAt),
      updatedAt: toIso(user.updatedAt),
    };

    return NextResponse.json({ account, live, liveError });
  } catch (error) {
    return errorResponse(error);
  }
}
