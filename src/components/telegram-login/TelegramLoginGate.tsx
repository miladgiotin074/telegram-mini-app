'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { useRouter } from 'next/navigation';

import { Page } from '@/components/Page';
import { useSession } from '@/components/SessionProvider';
import { TelegramLoginScreen } from '@/components/telegram-login/TelegramLoginScreen';
import { FullscreenLoader } from '@/components/ui/Loader';
import { paintAppChrome, paintTelegramLoginChrome } from '@/core/miniAppChrome';
import { requireTelegramLogin } from '@/lib/api';
import { isTelegramLoginLocked, type LoginNext } from '@/lib/chatGate';

type TelegramLoginGateValue = {
  openTelegramLogin: (options?: { next?: LoginNext }) => Promise<void>;
};

const TelegramLoginGateContext = createContext<TelegramLoginGateValue | null>(null);

function LoginCover({
  locked,
  rising,
  onFinished,
  onDismiss,
}: {
  locked: boolean;
  rising: boolean;
  onFinished: (path: LoginNext) => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    paintTelegramLoginChrome();
    return paintAppChrome;
  }, []);

  return (
    <Page back={false}>
      <TelegramLoginScreen
        locked={locked}
        rising={rising}
        onFinished={onFinished}
        onDismiss={onDismiss}
      />
    </Page>
  );
}

/**
 * After Telegram login is shown once, it becomes the Mini App until the
 * account is connected. Reopening the app still lands here.
 */
export function TelegramLoginGate({ children }: PropsWithChildren) {
  const router = useRouter();
  const { session, loading, setSession } = useSession();
  const locked = isTelegramLoginLocked(session) && !session?.isAdmin;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rising, setRising] = useState(false);
  const [enteredFromApp, setEnteredFromApp] = useState(false);
  const nextRef = useRef<LoginNext>('/');

  useEffect(() => {
    if (!enteredFromApp && session?.matchedProfileSlug) {
      nextRef.current = '/chat';
    }
  }, [enteredFromApp, session?.matchedProfileSlug]);

  useEffect(() => {
    if (!rising) {
      return;
    }

    const timer = window.setTimeout(() => setRising(false), 700);
    return () => window.clearTimeout(timer);
  }, [rising]);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setRising(false);
    setEnteredFromApp(false);
  }, []);

  const openTelegramLogin = useCallback(
    async (options?: { next?: LoginNext }) => {
      nextRef.current = options?.next ?? (session?.matchedProfileSlug ? '/chat' : '/');
      setEnteredFromApp(true);
      setRising(true);
      setSheetOpen(true);

      try {
        const { session: next } = await requireTelegramLogin();
        setSession(next);
      } catch {
        closeSheet();
      }
    },
    [closeSheet, session?.matchedProfileSlug, setSession],
  );

  const onFinished = useCallback(
    (_path: LoginNext) => {
      closeSheet();
      router.replace(nextRef.current);
    },
    [closeSheet, router],
  );

  const onDismiss = useCallback(() => {
    if (isTelegramLoginLocked(session)) {
      return;
    }
    closeSheet();
  }, [closeSheet, session]);

  const value = useMemo(() => ({ openTelegramLogin }), [openTelegramLogin]);

  if (loading) {
    return (
      <TelegramLoginGateContext.Provider value={value}>
        <FullscreenLoader />
      </TelegramLoginGateContext.Provider>
    );
  }

  if (locked && !enteredFromApp) {
    return (
      <TelegramLoginGateContext.Provider value={value}>
        <LoginCover locked rising={false} onFinished={onFinished} onDismiss={onDismiss} />
      </TelegramLoginGateContext.Provider>
    );
  }

  return (
    <TelegramLoginGateContext.Provider value={value}>
      <div
        inert={sheetOpen || undefined}
        className={
          sheetOpen && enteredFromApp
            ? 'origin-bottom scale-[0.96] opacity-70 transition-[transform,opacity] duration-500'
            : undefined
        }
      >
        {children}
      </div>
      {sheetOpen ? (
        <LoginCover locked={locked} rising={rising} onFinished={onFinished} onDismiss={onDismiss} />
      ) : null}
    </TelegramLoginGateContext.Provider>
  );
}

export function useTelegramLoginGate(): TelegramLoginGateValue {
  const context = useContext(TelegramLoginGateContext);

  if (!context) {
    throw new Error('useTelegramLoginGate must be used inside <TelegramLoginGate>');
  }

  return context;
}
