'use client';

import { useEffect, useRef, useState } from 'react';

const BARS = [8, 14, 20, 12, 24, 16, 10, 22, 14, 18, 9, 21, 13, 17, 11, 19];

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;

  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/** Colour sets so the bubble reads well on the brand and on the surface bubble. */
const TONES = {
  onBrand: {
    button: 'bg-white/20 text-white',
    barActive: 'bg-white',
    barIdle: 'bg-white/35',
    duration: 'text-white/75',
  },
  onSurface: {
    button: 'bg-brand/20 text-brand-soft',
    barActive: 'bg-brand-soft',
    barIdle: 'bg-app-muted/40',
    duration: 'text-app-muted',
  },
} as const;

export function VoiceBubble({
  src,
  durationSec,
  tone = 'onBrand',
}: {
  src: string;
  durationSec: number;
  tone?: keyof typeof TONES;
}) {
  const colors = TONES[tone];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };

    const onTimeUpdate = () => {
      const total = audio.duration || durationSec || 1;
      setProgress(Math.min(1, audio.currentTime / total));
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [durationSec]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    void audio.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  };

  const activeBars = Math.round(progress * BARS.length);

  return (
    <div className="flex items-center gap-3">
      <audio ref={audioRef} src={src} preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'توقف' : 'پخش'}
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${colors.button}`}
      >
        {playing ? '❚❚' : '▶'}
      </button>

      <div className="flex flex-1 items-center gap-[3px]" dir="ltr">
        {BARS.map((height, index) => (
          <span
            key={index}
            className={`w-[3px] rounded-full ${
              index < activeBars ? colors.barActive : colors.barIdle
            }`}
            style={{ height }}
          />
        ))}
      </div>

      <span className={`shrink-0 text-xs tabular-nums ${colors.duration}`} dir="ltr">
        {formatDuration(durationSec)}
      </span>
    </div>
  );
}
