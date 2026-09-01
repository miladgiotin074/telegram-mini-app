import { NextResponse } from 'next/server';

import { requireUser } from '@/server/auth';
import { errorResponse } from '@/server/http';
import { GENDERS, User, type Gender, type UserDoc } from '@/server/models/User';
import { toSession } from '@/server/serialize';

function isGender(value: unknown): value is Gender {
  return typeof value === 'string' && (GENDERS as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { gender?: unknown; isAdultConfirmed?: unknown };

    if (!isGender(body.gender)) {
      return NextResponse.json({ error: 'gender must be male or female' }, { status: 400 });
    }

    if (body.isAdultConfirmed !== true) {
      return NextResponse.json({ error: 'adult confirmation is required' }, { status: 400 });
    }

    const updated = await User.findOneAndUpdate(
      { telegramId: user.telegramId },
      { $set: { gender: body.gender, isAdultConfirmed: true } },
      { returnDocument: 'after' },
    ).lean<UserDoc>();

    if (!updated) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 });
    }

    return NextResponse.json({ session: toSession(updated) });
  } catch (error) {
    return errorResponse(error);
  }
}
