'use client';

import { useRef, useState } from 'react';

import { ProtectedImage } from '@/components/ProtectedImage';
import { MediaViewer } from '@/components/profile/MediaViewer';
import { VideoOverlay, VideoThumbnail } from '@/components/profile/postMedia';
import { toPersianDigits } from '@/lib/numbers';
import { MAX_USER_POSTS, type ProfilePost } from '@/lib/types';

type Mode = 'view' | 'manage';

/**
 * The user's own six-slot grid: empty slots invite an upload, filled ones open
 * the media, and management mode exposes a delete action per post.
 */
export function EditablePostGrid({
  posts,
  busy,
  onUpload,
  onDelete,
}: {
  posts: ProfilePost[];
  busy: boolean;
  onUpload: (file: File) => void;
  onDelete: (order: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [active, setActive] = useState<ProfilePost | null>(null);
  const [mode, setMode] = useState<Mode>('view');

  const emptySlots = Math.max(0, MAX_USER_POSTS - posts.length);
  const slots = Array.from({ length: emptySlots }, (_, index) => index);

  const pickFile = () => inputRef.current?.click();

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-app-muted">
          پست‌های من ({toPersianDigits(posts.length)} از {toPersianDigits(MAX_USER_POSTS)})
        </p>

        {posts.length > 0 && (
          <button
            type="button"
            onClick={() => setMode(mode === 'view' ? 'manage' : 'view')}
            className="text-xs font-bold text-brand-soft"
          >
            {mode === 'view' ? 'ویرایش' : 'پایان'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-2xl border border-app-border">
        {posts.map((post) => {
          const isVideo = post.type === 'video';

          return (
            <div key={post.order} className="relative aspect-square overflow-hidden">
              <button
                type="button"
                onClick={() => setActive(post)}
                aria-label={isVideo ? 'پخش ویدیو' : 'نمایش عکس'}
                className="block size-full transition-opacity active:opacity-70"
              >
                {isVideo ? (
                  <>
                    <VideoThumbnail src={post.url} label="ویدیو" />
                    <VideoOverlay />
                  </>
                ) : (
                  <ProtectedImage src={post.poster} label="عکس" className="size-full" />
                )}
              </button>

              {mode === 'manage' && (
                <button
                  type="button"
                  onClick={() => onDelete(post.order)}
                  disabled={busy}
                  aria-label="حذف پست"
                  className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg text-white disabled:opacity-60"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-red-500/90">
                    ✕
                  </span>
                </button>
              )}
            </div>
          );
        })}

        {slots.map((slot) => (
          <button
            key={`empty-${slot}`}
            type="button"
            onClick={pickFile}
            disabled={busy}
            aria-label="افزودن پست"
            className="flex aspect-square flex-col items-center justify-center gap-1 bg-app-surface text-app-muted transition-colors active:bg-app-surface-2 disabled:opacity-60"
          >
            <span className="text-xl leading-none">＋</span>
            <span className="text-[9px]">افزودن</span>
          </button>
        ))}
      </div>

      {posts.length < MAX_USER_POSTS && (
        <button
          type="button"
          onClick={pickFile}
          disabled={busy}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-app-border bg-app-surface py-3.5 text-sm font-bold text-app-text transition-colors active:bg-app-surface-2 disabled:opacity-60"
        >
          {busy ? (
            <span className="size-4 animate-spin rounded-full border-2 border-app-muted/40 border-t-brand" />
          ) : (
            <>
              <span aria-hidden className="text-brand">
                ＋
              </span>
              افزودن عکس یا ویدیو
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';

          if (file) {
            onUpload(file);
          }
        }}
      />

      {active && <MediaViewer media={active} onClose={() => setActive(null)} />}
    </>
  );
}
