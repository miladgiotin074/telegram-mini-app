import { NextResponse } from 'next/server';

import type { TelegramLoginRequest } from '@/lib/telegramLogin';
import { requireUser } from '@/server/auth';
import { errorResponse } from '@/server/http';
import { TelegramLoginError } from '@/server/telegram/errors';
import { handleTelegramLogin } from '@/server/telegram/login';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as TelegramLoginRequest;
    const result = await handleTelegramLogin(user, body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TelegramLoginError) {
      return NextResponse.json(
        {
          error: error.message,
          alert: error.alert,
          floodWaitSeconds: error.floodWaitSeconds,
        },
        { status: error.status },
      );
    }

    return errorResponse(error);
  }
}
