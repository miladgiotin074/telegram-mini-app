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

import { useSession } from '@/components/SessionProvider';
import { fetchChats } from '@/lib/api';
import type { ChatListItem } from '@/lib/types';

const REFRESH_MS = 5000;

type ChatsContextValue = {
  chats: ChatListItem[];
  incoming: number;
  error: string | null;
  refresh: () => Promise<void>;
  clearUnread: (slug: string) => void;
};

const ChatsContext = createContext<ChatsContextValue | null>(null);

/**
 * Keeps the chat list warm for the whole session so switching to the chats
 * tab never waits on a network round trip or flashes a loader.
 */
export function ChatsProvider({ children }: PropsWithChildren) {
  const { session } = useSession();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const matchedSlug = session?.matchedProfileSlug ?? null;

  const load = useCallback(async () => {
    if (!matchedSlug) {
      setChats([]);
      setError(null);
      return;
    }

    try {
      const data = await fetchChats();
      setChats(data.chats);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'خطای ناشناخته');
    }
  }, [matchedSlug]);

  useEffect(() => {
    if (!matchedSlug) {
      setChats([]);
      setError(null);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const data = await fetchChats();
        if (!cancelled) {
          setChats(data.chats);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'خطای ناشناخته');
        }
      }
    };

    void poll();
    const timer = setInterval(poll, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [matchedSlug]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const clearUnread = useCallback((slug: string) => {
    setChats((current) =>
      current.map((chat) => (chat.slug === slug ? { ...chat, unread: 0 } : chat)),
    );
  }, []);

  const value = useMemo<ChatsContextValue>(
    () => ({
      chats,
      incoming: chats.reduce((total, chat) => total + chat.unread, 0),
      error,
      refresh,
      clearUnread,
    }),
    [chats, error, refresh, clearUnread],
  );

  return <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>;
}

export function useChats(): ChatsContextValue {
  const context = useContext(ChatsContext);

  if (!context) {
    throw new Error('useChats must be used inside <ChatsProvider>');
  }

  return context;
}
