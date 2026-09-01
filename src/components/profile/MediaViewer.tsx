'use client';

import { useEffect, useRef, useState } from 'react';

import { ProtectedImage } from '@/components/ProtectedImage';
import {
  closeHistoryOverlay,
  useHistoryOverlay,
} from '@/components/overlay/useHistoryOverlay';

export type ViewerMedia = {
  type: 'image' | 'video';
  /** Full-size media. For images this is usually the same as `poster`. */
  url: string;
  poster: string;
};

/**
 * Full-screen media overlay.
 *
 * A history entry is pushed while the overlay is open, so the device back
 * button (and Telegram's own back button, which calls `router.back()`) closes
 * the media instead of leaving the screen.
 */
export function MediaViewer({
  media,
  onClose,
}: {
  media: ViewerMedia;
  onClose: () => void;
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const showVideo = media.type === 'video' && !videoFailed;

  useHistoryOverlay(onClose);

  useEffect(() => {
    if (!showVideo) {
      return;
    }

    // Opening the viewer is a user gesture, so playback is allowed to start.
    void videoRef.current?.play().catch(() => undefined);
  }, [showVideo]);

  // Going back pops the pushed entry, which triggers the actual close.
  const requestClose = closeHistoryOverlay;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
      <div className="flex justify-end px-4 py-4">
        <button
          type="button"
          onClick={requestClose}
          aria-label="بستن"
          className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/30 transition-colors active:bg-white/25"
        >
          <span className="text-base leading-none">✕</span>
          بستن
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-10">
        {showVideo ? (
          <video
            ref={videoRef}
            src={media.url}
            controls
            autoPlay
            playsInline
            controlsList="nodownload"
            preload="metadata"
            onContextMenu={(event) => event.preventDefault()}
            onError={() => setVideoFailed(true)}
            className="max-h-full w-full rounded-2xl"
          />
        ) : (
          <div className="w-full">
            <ProtectedImage
              src={media.poster}
              label="تصویر"
              className="h-[70vh] w-full rounded-2xl"
              style={{ backgroundSize: 'contain' }}
            />
            {media.type === 'video' && (
              <p className="mt-3 text-center text-xs text-white/50">
                فایل ویدیو هنوز بارگذاری نشده است.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
