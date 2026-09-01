import type { PropsWithChildren } from 'react';

/** Full-height shell that respects the device safe areas. */
export function Screen({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`relative flex h-screen flex-col overflow-hidden bg-app-bg ${className}`}
      style={{
        // Dynamic viewport height where supported; the class above is the
        // fallback. A fixed height (not min-height) is what lets inner
        // `flex-1 overflow-y-auto` regions scroll instead of stretching.
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {children}
    </div>
  );
}

/** Soft moving colour orbs used as a background on the story-like screens. */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="animate-orb absolute -top-24 -right-16 size-64 rounded-full bg-brand/25 blur-3xl" />
      <span
        className="animate-orb absolute top-1/3 -left-24 size-72 rounded-full bg-accent/20 blur-3xl"
        style={{ animationDelay: '3s' }}
      />
      <span
        className="animate-orb absolute -bottom-24 right-1/4 size-64 rounded-full bg-brand-strong/20 blur-3xl"
        style={{ animationDelay: '6s' }}
      />
    </div>
  );
}

export function CenteredState({ children }: PropsWithChildren) {
  return (
    <Screen>
      <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-app-muted">
        {children}
      </div>
    </Screen>
  );
}
