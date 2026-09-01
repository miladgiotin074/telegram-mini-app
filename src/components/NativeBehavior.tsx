'use client';

import { useEffect } from 'react';

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable ||
    target.closest('.selectable') !== null
  );
}

/**
 * Suppresses browser-specific affordances (context menu, selection, drag, pinch
 * zoom) so the mini app feels like a native Android screen instead of a website.
 */
// Safari/iOS pinch-zoom event, missing from the standard DOM event map.
const GESTURE_START = 'gesturestart' as keyof DocumentEventMap;

export function NativeBehavior() {
  useEffect(() => {
    const prevent = (event: Event) => {
      event.preventDefault();
    };

    const preventUnlessEditable = (event: Event) => {
      if (!isEditable(event.target)) {
        event.preventDefault();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (process.env.NODE_ENV !== 'production') {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === 'f12') {
        event.preventDefault();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && ['i', 'j', 'c'].includes(key)) {
        event.preventDefault();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && ['u', 's', 'p', 'a'].includes(key)) {
        if (key === 'a' && isEditable(event.target)) {
          return;
        }
        event.preventDefault();
      }
    };

    document.addEventListener('contextmenu', prevent);
    document.addEventListener('dragstart', prevent);
    document.addEventListener(GESTURE_START, prevent);
    document.addEventListener('selectstart', preventUnlessEditable);
    document.addEventListener('copy', preventUnlessEditable);
    document.addEventListener('cut', preventUnlessEditable);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('dragstart', prevent);
      document.removeEventListener(GESTURE_START, prevent);
      document.removeEventListener('selectstart', preventUnlessEditable);
      document.removeEventListener('copy', preventUnlessEditable);
      document.removeEventListener('cut', preventUnlessEditable);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return null;
}
