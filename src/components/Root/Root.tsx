'use client';

import { type PropsWithChildren } from 'react';

import { ChatsProvider } from '@/components/ChatsProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorPage } from '@/components/ErrorPage';
import { SessionProvider } from '@/components/SessionProvider';
import { TabHost } from '@/components/nav/TabHost';
import { TelegramLoginGate } from '@/components/telegram-login/TelegramLoginGate';
import { useDidMount } from '@/hooks/useDidMount';

import './styles.css';

export function Root({ children }: PropsWithChildren) {
  const didMount = useDidMount();

  if (!didMount) {
    return (
      <div className="root__loading">
        <span className="relative flex size-24 items-center justify-center">
          <span className="root__loading-ring" />
          <span className="root__loading-ring" />
          <span className="root__loading-ring" />
          <span className="root__loading-heart">❤️</span>
        </span>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={ErrorPage}>
      <SessionProvider>
        <TelegramLoginGate>
          <ChatsProvider>
            <TabHost>{children}</TabHost>
          </ChatsProvider>
        </TelegramLoginGate>
      </SessionProvider>
    </ErrorBoundary>
  );
}
