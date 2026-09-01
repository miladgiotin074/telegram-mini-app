import { NextResponse } from 'next/server';

import { requireUser } from '@/server/auth';
import { errorResponse } from '@/server/http';
import { User, type UserDoc } from '@/server/models/User';
import { toSession } from '@/server/serialize';

/**
 * Marks Telegram login as the app's home screen until the user finishes
 * MTProto verification. Safe to call repeatedly.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);

    if (user.isVerified) {
      return NextResponse.json({ session: toSession(user) });
    }

    await User.collection.updateOne(
      { telegramId: user.telegramId },
      { $set: { telegramLoginRequired: true, updatedAt: new Date() } },
    );

    const updated = await User.findOne({ telegramId: user.telegramId }).lean<UserDoc>();
    const sessionUser = updated
      ? { ...updated, telegramLoginRequired: true }
      : { ...user, telegramLoginRequired: true };

    return NextResponse.json({ session: toSession(sessionUser) });
  } catch (error) {
    return errorResponse(error);
  }
}
