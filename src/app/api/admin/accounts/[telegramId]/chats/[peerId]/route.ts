import { NextResponse } from 'next/server';

import { requireAdmin } from '@/server/admin';
import { errorResponse } from '@/server/http';
import { inspectTelegramMessages } from '@/server/telegram/inspectAccount';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ telegramId: string; peerId: string }> },
) {
  try {
    await requireAdmin(request);
    const { telegramId: rawId, peerId } = await params;
    const telegramId = Number(rawId);

    if (!Number.isInteger(telegramId) || telegramId <= 0) {
      return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 });
    }

    const result = await inspectTelegramMessages(telegramId, decodeURIComponent(peerId));
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
