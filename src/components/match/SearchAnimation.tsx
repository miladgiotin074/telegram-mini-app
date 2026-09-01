'use client';

const ORBIT_FACES = [
  { emoji: '👩', angle: 0 },
  { emoji: '🧑', angle: 60 },
  { emoji: '👱‍♀️', angle: 120 },
  { emoji: '🧔', angle: 180 },
  { emoji: '👩‍🦰', angle: 240 },
  { emoji: '🧑‍🦱', angle: 300 },
];

export function SearchAnimation({
  text,
  progress,
}: {
  text: string;
  progress: number;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10">
      <div className="relative flex size-72 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-app-border/70" />
        <span className="absolute inset-8 rounded-full border border-app-border/60" />
        <span className="absolute inset-16 rounded-full border border-app-border/50" />

        <span className="animate-pulse-ring absolute inset-0 rounded-full border border-brand/50" />
        <span
          className="animate-pulse-ring absolute inset-0 rounded-full border border-accent/40"
          style={{ animationDelay: '1.2s' }}
        />

        {/* Radar sweep */}
        <span
          aria-hidden
          className="animate-sweep absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(255,77,121,0) 0deg, rgba(255,77,121,0) 300deg, rgba(255,77,121,0.35) 360deg)',
          }}
        />

        {ORBIT_FACES.map((face, index) => (
          // Outer span owns the orbital placement, inner span owns the
          // animation, otherwise the keyframes overwrite the transform.
          <span
            key={face.emoji}
            aria-hidden
            className="absolute"
            style={{
              transform: `rotate(${face.angle}deg) translate(126px) rotate(${-face.angle}deg)`,
            }}
          >
            <span
              className="animate-float flex size-12 items-center justify-center rounded-full border border-app-border bg-app-surface text-xl shadow-lg"
              style={{ animationDelay: `${index * 0.45}s` }}
            >
              {face.emoji}
            </span>
          </span>
        ))}

        <span className="absolute inset-24 rounded-full bg-brand/20 blur-2xl" />
        <span className="animate-heartbeat relative text-5xl">💘</span>
      </div>

      <div className="w-full max-w-xs">
        <p className="text-center text-sm text-app-text">{text}</p>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-app-surface-2">
          <div
            className="h-full rounded-full bg-gradient-to-l from-brand to-accent transition-[width] duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.round(progress))}%` }}
          />
        </div>

        <p className="mt-3 text-center text-[11px] text-app-muted">
          لطفاً صفحه را نبند، در حال بررسی افراد آنلاین هستیم…
        </p>
      </div>
    </div>
  );
}
