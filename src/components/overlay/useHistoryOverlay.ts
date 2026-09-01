'use client';

import { useEffect, useRef } from 'react';

import { useOverlayBackButton } from '@/components/Page';

let counter = 0;

/** Ids of the overlays that are currently open, innermost last. */
const stack: number[] = [];

/**
 * Turns a full-screen overlay into a history entry so the device back button
 * closes it instead of leaving the screen.
 *
 * Overlays can be nested (a media viewer on top of a profile sheet). Every
 * listener sees the same `popstate`, so only the innermost one reacts to it.
 * Listeners run in registration order, meaning outer overlays are checked
 * first and bail out early.
 */
export function useHistoryOverlay(onClose: () => void) {
  useOverlayBackButton();

  const closeRef = useRef(onClose);
  const idRef = useRef<number | null>(null);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Guarded by a ref so React's development double-effect does not add a
    // second history entry for the same overlay.
    if (idRef.current === null) {
      counter += 1;
      idRef.current = counter;
      window.history.pushState({ overlay: counter }, '');
    }

    const id = idRef.current;

    if (!stack.includes(id)) {
      stack.push(id);
    }

    const isInnermost = () => stack[stack.length - 1] === id;

    const onPopState = () => {
      if (!isInnermost()) {
        return;
      }

      stack.pop();
      closeRef.current();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isInnermost()) {
        window.history.back();
      }
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      const index = stack.indexOf(id);

      if (index >= 0) {
        stack.splice(index, 1);
      }

      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);
}

/** Closes the innermost overlay by consuming its history entry. */
export function closeHistoryOverlay() {
  window.history.back();
}

/**
 * Drops the current overlay history entry without `history.back()`.
 *
 * `history.back()` fires `popstate`, which Next.js and this screen both
 * listen to. After a successful login step that must navigate forward,
 * that pop can reset the screen (or remount `/login`) instead of opening
 * the code page.
 */
export function replaceHistoryOverlay(nextState: Record<string, unknown> = {}) {
  const state = window.history.state as { overlay?: number } | null;
  if (!state || typeof state !== 'object' || !state.overlay) {
    return;
  }
  window.history.replaceState(nextState, '');
}
