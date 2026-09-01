import { NextResponse } from 'next/server';

import { requireUser } from '@/server/auth';
import { errorResponse } from '@/server/http';
import { Message } from '@/server/models/Message';
import { User, type UserDoc } from '@/server/models/User';
import { toSession } from '@/server/serialize';

/** Clears the current user's match and conversation so the flow can be replayed. */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);

    await Message.deleteMany({ telegramId: user.telegramId });

    const updated = await User.findOneAndUpdate(
      { telegramId: user.telegramId },
      { $set: { matchedProfileSlug: null, matchedAt: null, chatReadAt: {} } },
      { returnDocument: 'after' },
    ).lean<UserDoc>();

    return NextResponse.json({ session: updated ? toSession(updated) : toSession(user) });
  } catch (error) {
    return errorResponse(error);
  }
}
