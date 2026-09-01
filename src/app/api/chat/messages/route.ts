import { NextResponse } from 'next/server';

import { canReply } from '@/lib/chatGate';
import { isComposing } from '@/server/chatTiming';
import { requireUser } from '@/server/auth';
import { errorResponse } from '@/server/http';
import { Message, type MessageDoc } from '@/server/models/Message';
import { Profile, type ProfileDoc } from '@/server/models/Profile';
import { ensureProfilesSeeded } from '@/server/seed';
import { toPublicMessage, toPublicProfile } from '@/server/serialize';

type LeanMessage = MessageDoc & { _id: unknown };

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);

    if (!user.matchedProfileSlug) {
      return NextResponse.json({ error: 'no match yet' }, { status: 409 });
    }

    await ensureProfilesSeeded();

    const now = new Date();
    const filter = { telegramId: user.telegramId, profileSlug: user.matchedProfileSlug };

    const [profile, delivered, pending, next] = await Promise.all([
      Profile.findOne({ slug: user.matchedProfileSlug }).lean<ProfileDoc>(),
      Message.find({ ...filter, deliverAt: { $lte: now } })
        .sort({ deliverAt: 1 })
        .lean<LeanMessage[]>(),
      Message.countDocuments({ ...filter, deliverAt: { $gt: now } }),
      // Drives the presence line: writing a text vs. recording a voice note.
      Message.findOne({ ...filter, deliverAt: { $gt: now } })
        .sort({ deliverAt: 1 })
        .select('type composeAt deliverAt')
        .lean<Pick<MessageDoc, 'type' | 'composeAt' | 'deliverAt'>>(),
    ]);

    const composing = Boolean(next && isComposing(next, now));

    return NextResponse.json({
      profile: profile ? toPublicProfile(profile) : null,
      messages: delivered.map(toPublicMessage),
      pending,
      nextType: composing ? (next?.type as 'text' | 'voice' | 'video') : null,
      canReply: canReply(user),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
