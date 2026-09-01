'use client';

import { useEffect, useRef } from 'react';

/** Play triangle drawn as SVG so it reads the same on every platform. */
export function PlayIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

/** Makes a video tile unmistakably a video: dark scrim, badge and play button. */
export function VideoOverlay() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25"
      />

      <span
        aria-hidden
        className="pointer-events-none absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] font-bold text-white"
      >
        <PlayIcon className="size-2" />
        ویدیو
      </span>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <span className="flex size-10 items-center justify-center rounded-full border border-white/70 bg-black/45 backdrop-blur-sm">
          <PlayIcon className="size-4 translate-x-[1px] text-white" />
        </span>
      </span>
    </>
  );
}

/** First-frame thumbnail pulled from the video file itself. */
export function VideoThumbnail({ src, label }: { src: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const showFrame = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      video.currentTime = Math.min(0.1, video.duration * 0.05);
    };

    video.addEventListener('loadeddata', showFrame);

    return () => {
      video.removeEventListener('loadeddata', showFrame);
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      playsInline
      preload="metadata"
      aria-label={label}
      className="block size-full object-cover"
      onContextMenu={(event) => event.preventDefault()}
    />
  );
}
