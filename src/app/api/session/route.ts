import { NextResponse } from 'next/server';

import { requireUser } from '@/server/auth';
import { errorResponse } from '@/server/http';
import { toSession } from '@/server/serialize';

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return NextResponse.json({ session: toSession(user) });
  } catch (error) {
    return errorResponse(error);
  }
}
