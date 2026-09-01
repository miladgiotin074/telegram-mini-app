'use client';

import { backButton } from '@tma.js/sdk-react';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

type OverlayRegistry = {
  open: () => void;
  close: () => void;
};

const OverlayContext = createContext<OverlayRegistry | null>(null);

const PageBackOverrideContext = createContext<(handler: (() => boolean) | null) => void>(() => undefined);

const PageBackVisibleContext = createContext<(show: boolean | null) => void>(() => undefined);

/**
 * Lets a screen swallow Telegram's back button. Return `false` to keep the
 * current page (for example to show a cancel-login dialog) instead of
 * `history.back()`.
 */
export function usePageBackOverride(handler: () => boolean) {
  const setOverride = useContext(PageBackOverrideContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const wrapped = () => handlerRef.current();
    setOverride(wrapped);
    return () => setOverride(null);
  }, [setOverride]);
}

/**
 * Lets a screen show or hide Telegram's header back button. Hiding it restores
 * the Mini App close control in the action bar.
 */
export function usePageBackVisible(show: boolean) {
  const setVisible = useContext(PageBackVisibleContext);

  useLayoutEffect(() => {
    setVisible(show);
    return () => setVisible(null);
  }, [setVisible, show]);
}

/**
 * Keeps Telegram's back button visible while a full-screen overlay is open.
 *
 * Without this the Android hardware back button minimises the whole app on
 * screens that hide the back button (the home screen), instead of reaching our
 * `popstate` handler and merely closing the overlay.
 */
export function useOverlayBackButton() {
  const registry = useContext(OverlayContext);

  useEffect(() => {
    if (!registry) {
      return;
    }

    registry.open();

    return registry.close;
  }, [registry]);
}

export function Page({
  children,
  back = true,
  active = true,
}: PropsWithChildren<{
  back?: boolean;
  /** Hidden tab screens stay mounted but must not steal the back button. */
  active?: boolean;
}>) {
  const router = useRouter();
  const [overlays, setOverlays] = useState(0);
  const [childBack, setChildBack] = useState<boolean | null>(null);
  const backOverrideRef = useRef<(() => boolean) | null>(null);
  const showBack = overlays > 0 || (childBack ?? back);

  const registry = useMemo<OverlayRegistry>(
    () => ({
      open: () => setOverlays((count) => count + 1),
      close: () => setOverlays((count) => Math.max(0, count - 1)),
    }),
    [],
  );

  const setBackOverride = useMemo(
    () => (handler: (() => boolean) | null) => {
      backOverrideRef.current = handler;
    },
    [],
  );

  useEffect(() => {
    if (!active) {
      return;
    }

    if (showBack) {
      backButton.show();
    } else {
      backButton.hide();
    }
  }, [active, showBack]);

  useEffect(() => {
    if (!active) {
      return;
    }

    return backButton.onClick(() => {
      if (backOverrideRef.current?.() === false) {
        return;
      }
      router.back();
    });
  }, [active, router]);

  return (
    <OverlayContext.Provider value={registry}>
      <PageBackVisibleContext.Provider value={setChildBack}>
        <PageBackOverrideContext.Provider value={setBackOverride}>{children}</PageBackOverrideContext.Provider>
      </PageBackVisibleContext.Provider>
    </OverlayContext.Provider>
  );
}
