import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Used by Render health checks. Does not touch MongoDB so boot is not blocked. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
