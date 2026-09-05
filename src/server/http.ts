import { NextResponse } from 'next/server';

import { AuthError } from '@/server/auth';
import { TelegramLoginError } from '@/server/telegram/errors';

/** Turns thrown errors into a predictable JSON response. */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof TelegramLoginError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  const message = error instanceof Error ? error.message : 'Unexpected server error';

  return NextResponse.json({ error: message }, { status: 500 });
}
