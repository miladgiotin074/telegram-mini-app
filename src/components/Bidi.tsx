import type { ReactNode } from 'react';

import { atUsername, isPredominantlyLtr } from '@/lib/bidi';

type BidiLtrProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Isolates children as a left-to-right run inside the global RTL layout.
 * Prefer this (or the helpers below) whenever you show Latin text, numbers,
 * @handles, emails, URLs, API codes, etc.
 */
export function BidiLtr({ children, className }: BidiLtrProps) {
  return (
    <bdi dir="ltr" className={className ? `bidi-ltr ${className}` : 'bidi-ltr'}>
      {children}
    </bdi>
  );
}

/** Wraps plain text in {@link BidiLtr} only when heuristics say it is LTR. */
export function BidiAuto({ children, className }: { children: string; className?: string }) {
  if (!isPredominantlyLtr(children)) {
    return <>{children}</>;
  }

  return <BidiLtr className={className}>{children}</BidiLtr>;
}

/** Telegram / social handle — always `@username` with correct visual order. */
export function Username({ username, className }: { username: string; className?: string }) {
  return <BidiLtr className={className}>{atUsername(username)}</BidiLtr>;
}

/** Persian prefix + LTR name, e.g. «سلام Milad». */
export function RtlWithLtrSuffix({
  prefix,
  suffix,
  className,
}: {
  prefix: string;
  suffix: string;
  className?: string;
}) {
  return (
    <>
      {prefix}
      <BidiLtr className={className}>{suffix}</BidiLtr>
    </>
  );
}
