import { NextResponse } from 'next/server';

import { requireUser } from '@/server/auth';
import { errorResponse } from '@/server/http';
import { Upload } from '@/server/models/Upload';
import { User, type UserDoc } from '@/server/models/User';
import { MAX_USER_POSTS, toSession } from '@/server/serialize';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 12 * 1024 * 1024;

/** Adds one post to the user's grid. Expects a multipart body with `file`. */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const existing = user.posts ?? [];

    if (existing.length >= MAX_USER_POSTS) {
      return NextResponse.json(
        { error: `حداکثر ${MAX_USER_POSTS} پست می‌توانید داشته باشید` },
        { status: 409 },
      );
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'فایلی ارسال نشد' }, { status: 400 });
    }

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'فقط عکس یا ویدیو قابل ارسال است' },
        { status: 415 },
      );
    }

    // Browsers cannot decode HEIC/HEIF, so storing one would render a blank tile.
    if (/^image\/(heic|heif)/i.test(file.type)) {
      return NextResponse.json(
        { error: 'این قالب عکس پشتیبانی نمی‌شود؛ لطفاً JPG یا PNG بفرست' },
        { status: 415 },
      );
    }

    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

    if (file.size === 0 || file.size > limit) {
      return NextResponse.json(
        { error: `حجم فایل باید کمتر از ${Math.floor(limit / 1024 / 1024)} مگابایت باشد` },
        { status: 413 },
      );
    }

    const upload = await Upload.create({
      telegramId: user.telegramId,
      mimeType: file.type,
      sizeBytes: file.size,
      data: Buffer.from(await file.arrayBuffer()),
    });

    const nextOrder = existing.reduce((max, post) => Math.max(max, post.order), 0) + 1;

    const updated = await User.findOneAndUpdate(
      { telegramId: user.telegramId },
      {
        $push: {
          posts: {
            order: nextOrder,
            type: isVideo ? 'video' : 'image',
            uploadId: String(upload._id),
            mimeType: file.type,
          },
        },
      },
      { returnDocument: 'after' },
    ).lean<UserDoc>();

    return NextResponse.json({ session: toSession(updated ?? user) });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Removes a post (and its media) by `order`. */
export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    const order = Number(new URL(request.url).searchParams.get('order'));

    if (!Number.isInteger(order)) {
      return NextResponse.json({ error: 'order is required' }, { status: 400 });
    }

    const target = (user.posts ?? []).find((post) => post.order === order);

    if (!target) {
      return NextResponse.json({ error: 'post not found' }, { status: 404 });
    }

    await Upload.deleteOne({ _id: target.uploadId, telegramId: user.telegramId });

    const updated = await User.findOneAndUpdate(
      { telegramId: user.telegramId },
      { $pull: { posts: { order } } },
      { returnDocument: 'after' },
    ).lean<UserDoc>();

    return NextResponse.json({ session: toSession(updated ?? user) });
  } catch (error) {
    return errorResponse(error);
  }
}
