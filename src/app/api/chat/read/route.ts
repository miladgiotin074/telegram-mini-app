import { NextResponse } from 'next/server';

import { requireUser } from '@/server/auth';
import { errorResponse } from '@/server/http';
import { User } from '@/server/models/User';

/** Marks the current match's conversation as read up to now. */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);

    if (!user.matchedProfileSlug) {
      return NextResponse.json({ error: 'no match yet' }, { status: 409 });
    }

    await User.updateOne(
      { telegramId: user.telegramId },
      { $set: { [`chatReadAt.${user.matchedProfileSlug}`]: new Date() } },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
