import { NextResponse } from 'next/server';

import { DEFAULT_ALLOWED_MEDIA_HOSTS } from '@/lib/media';

const MAX_BYTES = 8 * 1024 * 1024;

function allowedHosts(): string[] {
  const fromEnv = (process.env.MEDIA_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  return [...DEFAULT_ALLOWED_MEDIA_HOSTS, ...fromEnv];
}

function isAllowed(url: URL): boolean {
  if (url.protocol !== 'https:') {
    return false;
  }

  const host = url.hostname.toLowerCase();
  return allowedHosts().some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get('url');

  if (!target) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: 'url is malformed' }, { status: 400 });
  }

  if (!isAllowed(parsed)) {
    return NextResponse.json({ error: 'host is not allowed' }, { status: 403 });
  }

  const upstream = await fetch(parsed, { cache: 'no-store' });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'upstream request failed' }, { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'only images are proxied' }, { status: 415 });
  }

  const contentLength = Number(upstream.headers.get('content-length') || 0);
  if (contentLength > MAX_BYTES) {
    return NextResponse.json({ error: 'image is too large' }, { status: 413 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
