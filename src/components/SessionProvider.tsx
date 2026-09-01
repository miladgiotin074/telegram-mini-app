'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { fetchSession } from '@/lib/api';
import type { Session } from '@/lib/types';

type SessionContextValue = {
  session: Session | null;
  loading: boolean;
  error: string | null;
  setSession: (session: Session) => void;
  reload: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Holds the session for the whole app. Screens that already receive a fresh
 * session from an API call push it here, so navigating between screens never
 * triggers another round trip or a loading flash.
 */
export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchSession();
        if (!cancelled) {
          setSessionState(data.session);
          setError(null);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'خطای ناشناخته');
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const setSession = useCallback((next: Session) => {
    setSessionState(next);
    setError(null);
    setLoading(false);
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  const value = useMemo(
    () => ({ session, loading, error, setSession, reload }),
    [session, loading, error, setSession, reload],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used inside <SessionProvider>');
  }

  return context;
}
