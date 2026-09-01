import { NextResponse } from 'next/server';

import { connectDb } from '@/server/db';
import { errorResponse } from '@/server/http';
import { Upload } from '@/server/models/Upload';

/**
 * Normalises the stored media into bytes.
 *
 * A `lean()` read bypasses Mongoose casting, so depending on driver settings
 * the value arrives either as a Node `Buffer` or as a BSON `Binary` wrapper.
 * Reading `byteOffset` off the wrapper yields `undefined` and silently
 * produces an empty body, which is why this has to be explicit.
 */
function toBytes(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  const inner = (value as { buffer?: unknown } | null)?.buffer;

  if (Buffer.isBuffer(inner)) {
    return inner;
  }

  if (inner instanceof ArrayBuffer || inner instanceof Uint8Array) {
    return Buffer.from(inner as ArrayBuffer);
  }

  return Buffer.alloc(0);
}

/**
 * Streams a user upload back to the client.
 *
 * Reachable without init data because it is referenced from `<img>`/`<video>`
 * tags, which cannot carry an Authorization header. Ids are opaque ObjectIds.
 */
/** Parses a single `bytes=start-end` range, clamped to the payload size. */
function parseRange(header: string | null, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? '');

  if (!match) {
    return null;
  }

  const [, rawStart, rawEnd] = match;

  if (rawStart === '' && rawEnd === '') {
    return null;
  }

  // A suffix range ("bytes=-500") asks for the trailing bytes.
  const start = rawStart === '' ? Math.max(0, size - Number(rawEnd)) : Number(rawStart);
  const end = rawStart === '' || rawEnd === '' ? size - 1 : Math.min(Number(rawEnd), size - 1);

  if (start > end || start >= size) {
    return null;
  }

  return { start, end };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    }

    await connectDb();

    const upload = await Upload.findById(id).lean();

    if (!upload) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    const bytes = toBytes(upload.data);

    if (bytes.byteLength === 0) {
      return NextResponse.json({ error: 'media is empty' }, { status: 404 });
    }

    const slice = (from: number, to: number) =>
      bytes.buffer.slice(bytes.byteOffset + from, bytes.byteOffset + to) as ArrayBuffer;

    const headers: Record<string, string> = {
      'Content-Type': upload.mimeType,
      'Cache-Control': 'private, max-age=31536000, immutable',
      // Safari refuses to play video from a source that cannot serve ranges.
      'Accept-Ranges': 'bytes',
    };

    const range = parseRange(request.headers.get('range'), bytes.byteLength);

    if (range) {
      const length = range.end - range.start + 1;

      return new Response(slice(range.start, range.end + 1), {
        status: 206,
        headers: {
          ...headers,
          'Content-Length': String(length),
          'Content-Range': `bytes ${range.start}-${range.end}/${bytes.byteLength}`,
        },
      });
    }

    return new Response(slice(0, bytes.byteLength), {
      headers: {
        ...headers,
        // Derived from the payload so the header can never disagree with it.
        'Content-Length': String(bytes.byteLength),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
