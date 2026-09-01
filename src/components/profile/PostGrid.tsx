'use client';

import { useState } from 'react';

import { ProtectedImage } from '@/components/ProtectedImage';
import { MediaViewer } from '@/components/profile/MediaViewer';
import { VideoOverlay, VideoThumbnail } from '@/components/profile/postMedia';
import type { ProfilePost } from '@/lib/types';

/** Instagram-like square grid of profile posts with a full-screen viewer. */
export function PostGrid({ posts }: { posts: ProfilePost[] }) {
  const [active, setActive] = useState<ProfilePost | null>(null);

  if (posts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post) => {
          const isVideo = post.type === 'video';

          return (
            <button
              key={post.order}
              type="button"
              onClick={() => setActive(post)}
              aria-label={isVideo ? 'پخش ویدیو' : 'نمایش عکس'}
              className="relative aspect-square overflow-hidden transition-opacity active:opacity-70"
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
          );
        })}
      </div>

      {active && <MediaViewer media={active} onClose={() => setActive(null)} />}
    </>
  );
}
