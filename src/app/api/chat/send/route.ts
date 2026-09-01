import { NextResponse } from 'next/server';

import { CHAT_LOCK_SEND_ERROR } from '@/lib/chatGate';
import { requireUser } from '@/server/auth';
import { errorResponse } from '@/server/http';
import { Message } from '@/server/models/Message';
import { toPublicMessage } from '@/server/serialize';

const MAX_TEXT_LENGTH = 2000;
/** Voice notes arrive as base64 data URLs, so cap them well below the BSON limit. */
const MAX_AUDIO_CHARS = 4_000_000;

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);

    if (!user.matchedProfileSlug) {
      return NextResponse.json({ error: 'no match yet' }, { status: 409 });
    }

    if (!user.isVerified) {
      return NextResponse.json({ error: CHAT_LOCK_SEND_ERROR }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      type?: string;
      text?: string;
      audioUrl?: string;
      durationSec?: number;
    };

    if (body.type !== 'text' && body.type !== 'voice') {
      return NextResponse.json({ error: 'type must be text or voice' }, { status: 400 });
    }

    const text = (body.text ?? '').trim();
    const audioUrl = body.audioUrl ?? '';

    if (body.type === 'text' && (!text || text.length > MAX_TEXT_LENGTH)) {
      return NextResponse.json({ error: 'invalid message text' }, { status: 400 });
    }

    if (body.type === 'voice') {
      if (!audioUrl.startsWith('data:audio/')) {
        return NextResponse.json({ error: 'invalid audio payload' }, { status: 400 });
      }

      if (audioUrl.length > MAX_AUDIO_CHARS) {
        return NextResponse.json({ error: 'voice message is too long' }, { status: 413 });
      }
    }

    const created = await Message.create({
      telegramId: user.telegramId,
      profileSlug: user.matchedProfileSlug,
      sender: 'user',
      type: body.type,
      text: body.type === 'text' ? text : '',
      audioUrl: body.type === 'voice' ? audioUrl : '',
      durationSec: body.type === 'voice' ? Math.max(1, Math.round(body.durationSec ?? 0)) : 0,
      deliverAt: new Date(),
    });

    return NextResponse.json({ message: toPublicMessage(created.toObject()) });
  } catch (error) {
    return errorResponse(error);
  }
}
