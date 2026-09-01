'use client';

function MatchArt() {
  return (
    <svg viewBox="0 0 280 220" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="onb-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff4d79" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="onb-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ff8aa7" />
        </linearGradient>
      </defs>
      <circle cx="140" cy="112" r="78" fill="#ff4d79" opacity="0.08" />
      <circle cx="140" cy="112" r="54" fill="none" stroke="#ff4d79" strokeOpacity="0.25" strokeWidth="2" />
      <circle cx="92" cy="118" r="38" fill="url(#onb-a)" />
      <circle cx="188" cy="108" r="38" fill="url(#onb-b)" />
      <circle cx="92" cy="106" r="12" fill="#fff" opacity="0.25" />
      <circle cx="188" cy="96" r="12" fill="#fff" opacity="0.25" />
      <path
        d="M140 128c6-14 24-16 32-6 8-12 26-8 30 6 4 16-18 30-30 38-12-8-34-22-32-38z"
        fill="#ff4d79"
      />
    </svg>
  );
}

function ChatArt() {
  return (
    <svg viewBox="0 0 280 220" className="h-full w-full" aria-hidden>
      <rect x="48" y="46" width="150" height="72" rx="24" fill="#ff4d79" />
      <rect x="82" y="132" width="150" height="56" rx="22" fill="#241533" stroke="#a855f7" strokeWidth="2" />
      <circle cx="78" cy="82" r="8" fill="#fff" opacity="0.9" />
      <circle cx="102" cy="82" r="8" fill="#fff" opacity="0.55" />
      <circle cx="126" cy="82" r="8" fill="#fff" opacity="0.35" />
      <rect x="108" y="152" width="88" height="8" rx="4" fill="#ff8aa7" opacity="0.8" />
      <rect x="108" y="166" width="56" height="8" rx="4" fill="#a855f7" opacity="0.7" />
      <path d="M214 64c10 0 18 8 18 22v18l14 10-14 4v12c0 14-8 22-18 22" fill="none" stroke="#ff8aa7" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function PrivateArt() {
  return (
    <svg viewBox="0 0 280 220" className="h-full w-full" aria-hidden>
      <path
        d="M168 46c28 0 50 22 50 50 0 8-2 16-6 22-22-18-54-18-76 0-4-6-6-14-6-22 0-28 22-50 38-50z"
        fill="#a855f7"
        opacity="0.85"
      />
      <rect x="98" y="108" width="84" height="70" rx="18" fill="#1b0f26" stroke="#ff4d79" strokeWidth="3" />
      <path d="M122 108v-16a18 18 0 0 1 36 0v16" fill="none" stroke="#ff8aa7" strokeWidth="6" strokeLinecap="round" />
      <circle cx="140" cy="144" r="8" fill="#ff4d79" />
    </svg>
  );
}

const FALLBACKS = {
  match: MatchArt,
  chat: ChatArt,
  private: PrivateArt,
} as const;

export function SlideArt({
  src,
  kind,
  loaded,
}: {
  src: string;
  kind: keyof typeof FALLBACKS;
  loaded: boolean;
}) {
  const Fallback = FALLBACKS[kind];

  return (
    <div className="relative mx-auto flex h-[min(42vh,280px)] w-full max-w-[280px] items-center justify-center">
      <span
        aria-hidden
        className="absolute inset-6 rounded-full bg-gradient-to-b from-brand/30 via-accent/10 to-transparent blur-2xl"
      />
      {loaded ? (
        <img
          src={src}
          alt=""
          className="relative z-10 h-full w-full object-contain"
          draggable={false}
        />
      ) : (
        <Fallback />
      )}
    </div>
  );
}
