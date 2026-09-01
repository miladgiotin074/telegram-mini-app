import { validate } from '@tma.js/init-data-node';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_TOKEN is not configured' },
      { status: 500 },
    );
  }

  try {
    const { initData } = (await request.json()) as { initData?: string };

    if (!initData) {
      return NextResponse.json({ error: 'initData is required' }, { status: 400 });
    }

    validate(initData, botToken, {
      expiresIn: 3600,
    });

    return NextResponse.json({ valid: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid init data';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
