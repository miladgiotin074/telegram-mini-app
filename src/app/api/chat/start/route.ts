import { NextResponse } from 'next/server';

import { composeDurationMs, idleDurationMs } from '@/server/chatTiming';
import { requireUser } from '@/server/auth';
import { errorResponse } from '@/server/http';
import { Message } from '@/server/models/Message';
import { Profile, type ProfileDoc } from '@/server/models/Profile';
import { toPublicProfile } from '@/server/serialize';

/**
 * Schedules the predefined conversation. Each scripted message gets a
 * `deliverAt` timestamp so it appears gradually, as if it were typed live.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);

    if (!user.matchedProfileSlug) {
      return NextResponse.json({ error: 'no match yet' }, { status: 409 });
    }

    const profile = await Profile.findOne({ slug: user.matchedProfileSlug }).lean<ProfileDoc>();

    if (!profile) {
      return NextResponse.json({ error: 'profile not found' }, { status: 404 });
    }

    const existing = await Message.countDocuments({
      telegramId: user.telegramId,
      profileSlug: profile.slug,
    });

    if (existing === 0) {
      let elapsed = 0;
      const now = Date.now();

      const scheduled = [...profile.script]
        .sort((a, b) => a.order - b.order)
        .map((item, index) => {
          elapsed += idleDurationMs(index === 0);
          const composeAt = new Date(now + elapsed);
          elapsed += composeDurationMs(item);

          return {
            telegramId: user.telegramId,
            profileSlug: profile.slug,
            sender: 'profile' as const,
            type: item.type,
            text: item.text ?? '',
            audioUrl: item.audioUrl ?? '',
            videoUrl: item.videoUrl ?? '',
            durationSec: item.durationSec ?? 0,
            composeAt,
            deliverAt: new Date(now + elapsed),
          };
        });

      if (scheduled.length > 0) {
        await Message.insertMany(scheduled);
      }
    }

    return NextResponse.json({ profile: toPublicProfile(profile) });
  } catch (error) {
    return errorResponse(error);
  }
}
