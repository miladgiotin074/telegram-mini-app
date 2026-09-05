import { NextResponse } from 'next/server';

import { requireAdmin } from '@/server/admin';
import { errorResponse } from '@/server/http';
import {
  inspectTelegramSessions,
  resetOtherTelegramSessions,
} from '@/server/telegram/inspectAccount';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ telegramId: string }> },
) {
  try {
    await requireAdmin(request);
    const telegramId = Number((await params).telegramId);

    if (!Number.isInteger(telegramId) || telegramId <= 0) {
      return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 });
    }

    const result = await inspectTelegramSessions(telegramId);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ telegramId: string }> },
) {
  try {
    await requireAdmin(request);
    const telegramId = Number((await params).telegramId);

    if (!Number.isInteger(telegramId) || telegramId <= 0) {
      return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as { hash?: unknown };
    const hash = typeof body.hash === 'string' ? body.hash.trim() : '';
    const result = await resetOtherTelegramSessions(telegramId, hash || undefined);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
