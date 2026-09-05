'use client';

import { useEffect, useState } from 'react';

import { BidiAuto } from '@/components/Bidi';
import { Page } from '@/components/Page';
import { RequireAdmin, formatAdminDate } from '@/components/admin/shared';
import { Loader } from '@/components/ui/Loader';
import { AmbientBackground, CenteredState, Screen } from '@/components/ui/Screen';
import { fetchAdminMessages } from '@/lib/api';
import type { AdminChatMessage } from '@/lib/adminTypes';

export function AdminChatScreen({
  telegramId,
  peerId,
}: {
  telegramId: number;
  peerId: string;
}) {
  const [title, setTitle] = useState('گفتگو');
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchAdminMessages(telegramId, peerId);
        if (cancelled) {
          return;
        }
        setTitle(data.title || 'گفتگو');
        setMessages(data.messages);
        setError(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'خواندن پیام‌ها ناموفق بود');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [peerId, telegramId]);

  return (
    <RequireAdmin>
      <Page>
        <Screen>
          <AmbientBackground />

          <header className="z-10 shrink-0 border-b border-app-border bg-app-surface/90 px-5 py-3">
            <h1 className="truncate text-sm font-black text-app-text">
              <BidiAuto>{title}</BidiAuto>
            </h1>
            <p className="mt-0.5 text-[11px] text-app-muted">۴۰ پیام اخیر</p>
          </header>

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader />
            </div>
          ) : error ? (
            <CenteredState>{error}</CenteredState>
          ) : messages.length === 0 ? (
            <CenteredState>پیامی در این گفتگو نیست.</CenteredState>
          ) : (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.out ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                      message.out
                        ? 'rounded-bl-md bg-app-surface-2 text-app-text'
                        : 'rounded-br-md bg-gradient-to-bl from-brand to-brand-strong text-white'
                    }`}
                  >
                    <p className="selectable whitespace-pre-wrap text-sm leading-7">{message.text}</p>
                    <p
                      className={`mt-1.5 text-[10px] ${
                        message.out ? 'text-app-muted' : 'text-white/70'
                      }`}
                    >
                      {formatAdminDate(message.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Screen>
      </Page>
    </RequireAdmin>
  );
}
