'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';

type Hole = {
  left: number;
  top: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
};

/**
 * Full-viewport coach mark, portaled to `document.body` so nav
 * `backdrop-filter` cannot trap it. The dimmer swallows every tap; only the
 * cloned search button above it is interactive.
 */
export function SearchCoach({
  anchorRef,
  onSelect,
}: {
  anchorRef: RefObject<HTMLButtonElement | null>;
  onSelect: () => void;
}) {
  const [hole, setHole] = useState<Hole | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const node = anchorRef.current;
      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      setHole({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
      });
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [anchorRef]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-coach-title"
    >
      <div className="absolute inset-0 bg-black/80" />

      {hole && (
        <>
          <div
            className="pointer-events-none absolute flex w-[min(20rem,calc(100vw-2rem))] flex-col items-center"
            style={{
              left: hole.cx,
              top: hole.top - 40,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="animate-sheet-in rounded-2xl border border-brand/50 bg-app-surface px-5 py-4 text-center shadow-2xl shadow-black/60">
              <p id="search-coach-title" className="text-[15px] font-black leading-7 text-app-text">
                برای شروع پیدا کردن کیس مناسب
              </p>
              <p className="mt-1 text-sm font-bold leading-6 text-brand-soft">روی دکمهٔ جستجو بزن</p>
            </div>
            <span aria-hidden className="animate-nudge mt-2 text-3xl leading-none text-brand-soft">
              ↓
            </span>
          </div>

          <button
            type="button"
            onClick={onSelect}
            aria-label="جستجو"
            className="fixed flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full bg-gradient-to-br from-brand to-accent text-white shadow-[0_0_0_8px_rgba(255,255,255,0.2),0_12px_40px_rgba(255,77,121,0.55)] transition-transform active:scale-95"
            style={{
              left: hole.left,
              top: hole.top - 28,
              width: hole.width,
              height: hole.height,
            }}
          >
            <span
              aria-hidden
              className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-white/70"
            />
            <span className="relative z-10 text-xl leading-none">🔍</span>
            <span className="relative z-10 text-[9px] font-black">جستجو</span>
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}
