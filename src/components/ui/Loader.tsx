const RING_DELAYS = ['0s', '0.8s', '1.6s'];

/** Wordless loading indicator: expanding rings around a beating heart. */
export function Loader({ size = 96 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="status"
      aria-label="در حال بارگذاری"
    >
      {RING_DELAYS.map((delay) => (
        <span
          key={delay}
          className="animate-pulse-ring absolute inset-0 rounded-full border border-brand/60"
          style={{ animationDelay: delay }}
        />
      ))}

      <span className="absolute inset-[22%] rounded-full bg-brand/15 blur-md" />

      <span
        className="animate-heartbeat relative text-3xl"
        style={{ fontSize: size * 0.34 }}
      >
        ❤️
      </span>
    </div>
  );
}

/** Full-screen wordless loading state. */
export function FullscreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg">
      <Loader />
    </div>
  );
}
