import { NextResponse } from 'next/server';

import { requireUser } from '@/server/auth';
import { errorResponse } from '@/server/http';
import { Profile, type ProfileDoc } from '@/server/models/Profile';
import { User, type UserDoc } from '@/server/models/User';
import { ensureProfilesSeeded } from '@/server/seed';
import { toPublicProfile, toSession } from '@/server/serialize';

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);

    if (!user.gender || !user.isAdultConfirmed) {
      return NextResponse.json({ error: 'onboarding is not complete' }, { status: 409 });
    }

    await ensureProfilesSeeded();

    // Everyone is matched with the same predefined profile of the opposite gender.
    const wantedGender = user.gender === 'male' ? 'female' : 'male';
    const profile = await Profile.findOne({ gender: wantedGender }).lean<ProfileDoc>();

    if (!profile) {
      return NextResponse.json({ error: 'no profile available' }, { status: 404 });
    }

    const updated = await User.findOneAndUpdate(
      { telegramId: user.telegramId },
      { $set: { matchedProfileSlug: profile.slug, matchedAt: new Date() } },
      { returnDocument: 'after' },
    ).lean<UserDoc>();

    return NextResponse.json({
      profile: toPublicProfile(profile),
      session: updated ? toSession(updated) : toSession(user),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
