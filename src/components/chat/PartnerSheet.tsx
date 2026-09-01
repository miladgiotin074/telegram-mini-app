'use client';

import { useState } from 'react';

import { ProtectedImage } from '@/components/ProtectedImage';
import {
  closeHistoryOverlay,
  useHistoryOverlay,
} from '@/components/overlay/useHistoryOverlay';
import { MediaViewer } from '@/components/profile/MediaViewer';
import { PostGrid } from '@/components/profile/PostGrid';
import type { MatchProfile } from '@/lib/types';

/**
 * The partner's profile, shown as an overlay above the chat rather than a
 * separate route. Opening and closing therefore needs no data fetch and no
 * loading state, which is what makes it feel native instead of web-like.
 */
export function PartnerSheet({
  profile,
  onClose,
}: {
  profile: MatchProfile;
  onClose: () => void;
}) {
  const [photoOpen, setPhotoOpen] = useState(false);

  useHistoryOverlay(onClose);

  return (
    <div className="animate-sheet-in fixed inset-0 z-40 flex flex-col overflow-hidden bg-app-bg">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <p className="text-sm font-black text-app-text">پروفایل</p>

        <button
          type="button"
          onClick={closeHistoryOverlay}
          aria-label="بازگشت به گفتگو"
          className="flex items-center gap-1.5 rounded-full bg-app-surface px-3.5 py-2 text-xs font-bold text-app-text ring-1 ring-app-border transition-colors active:bg-app-surface-2"
        >
          <span aria-hidden className="text-sm leading-none">
            ✕
          </span>
          بستن
        </button>
      </div>

      <div className="relative flex flex-1 flex-col justify-center gap-6 overflow-y-auto px-5 pb-6">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-10 h-56 bg-gradient-to-b from-brand/25 to-transparent blur-2xl"
        />

        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={() => setPhotoOpen(true)}
            aria-label="نمایش عکس پروفایل"
            className="rounded-full bg-gradient-to-tr from-brand via-brand-strong to-accent p-[3px] transition-transform active:scale-95"
          >
            <ProtectedImage
              src={profile.photo}
              label={profile.name}
              className="size-28 rounded-full border-2 border-app-bg"
            />
          </button>

          <h1 className="mt-4 text-xl font-black text-app-text">{profile.name}</h1>

          <p className="mt-2 line-clamp-2 max-w-xs text-center text-sm leading-6 text-app-muted">
            {profile.bio}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-app-border">
          <PostGrid posts={profile.posts} />
        </div>
      </div>

      {photoOpen && (
        <MediaViewer
          media={{ type: 'image', url: profile.photo, poster: profile.photo }}
          onClose={() => setPhotoOpen(false)}
        />
      )}
    </div>
  );
}
