'use client';

import { useEffect, useRef, useState } from 'react';

import { Page } from '@/components/Page';
import { ProtectedImage } from '@/components/ProtectedImage';
import { useChats } from '@/components/ChatsProvider';
import { useSession } from '@/components/SessionProvider';
import { Composer } from '@/components/chat/Composer';
import { PartnerSheet } from '@/components/chat/PartnerSheet';
import { VideoBubble } from '@/components/chat/VideoBubble';
import { VoiceBubble } from '@/components/chat/VoiceBubble';
import { FullscreenLoader } from '@/components/ui/Loader';
import { CenteredState, Screen } from '@/components/ui/Screen';
import { fetchMessages, markChatRead, startChat } from '@/lib/api';
import type { ChatMessage, MatchProfile } from '@/lib/types';

const POLL_INTERVAL_MS = 1500;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Polling is authoritative, but a reply sent between two polls is appended
 * locally first — merging by id keeps it visible instead of flickering away.
 */
function mergeMessages(local: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const seen = new Set(incoming.map((message) => message.id));
  const extras = local.filter((message) => !seen.has(message.id));

  return [...incoming, ...extras].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  );
}

function TypingIndicator() {
  return (
    <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-br-md bg-app-surface-2 px-4 py-3">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-app-muted"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

function SendingVideoIndicator() {
  return (
    <div className="flex w-fit items-center gap-2 rounded-2xl rounded-br-md bg-app-surface-2 px-4 py-3">
      <span aria-hidden>🎬</span>
      <span className="text-xs font-bold text-app-muted">در حال ارسال ویدیو…</span>
    </div>
  );
}

/** Growing bars plus a mic, so recording reads differently from typing. */
function RecordingIndicator() {
  return (
    <div className="flex w-fit items-center gap-2 rounded-2xl rounded-br-md bg-app-surface-2 px-4 py-3">
      <span aria-hidden className="text-xs">
        🎤
      </span>
      <span className="flex items-end gap-0.5">
        {[0, 120, 240, 360, 480].map((delay, index) => (
          <span
            key={delay}
            className="w-0.5 animate-bounce rounded-full bg-brand-soft"
            style={{
              height: `${6 + (index % 3) * 5}px`,
              animationDelay: `${delay}ms`,
              animationDuration: '900ms',
            }}
          />
        ))}
      </span>
    </div>
  );
}

export default function ChatPage() {
  const { session } = useSession();
  const { clearUnread, refresh } = useChats();
  const [profile, setProfile] = useState<MatchProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(0);
  const [nextType, setNextType] = useState<'text' | 'voice' | 'video' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const matchedSlug = session?.matchedProfileSlug ?? null;

  useEffect(() => {
    if (matchedSlug) {
      clearUnread(matchedSlug);
    }

    void markChatRead();
  }, [clearUnread, matchedSlug]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const data = await fetchMessages();
        if (cancelled) {
          return;
        }

        setProfile(data.profile);
        setMessages((current) => mergeMessages(current, data.messages));
        setPending(data.pending);
        setNextType(data.nextType);
        setLoading(false);
        void markChatRead();
        if (matchedSlug) {
          clearUnread(matchedSlug);
        }

        if (data.pending > 0) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (pollError) {
        if (cancelled) {
          return;
        }
        setError(pollError instanceof Error ? pollError.message : 'خطای ناشناخته');
        setLoading(false);
      }
    };

    // Scheduling happens here rather than during the search animation, so the
    // very first message arrives after the user is actually looking at the chat.
    const run = async () => {
      try {
        await startChat();
      } catch {
        // Already scheduled, or the match is missing — polling will report it.
      }

      if (!cancelled) {
        await poll();
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
      void markChatRead().then(() => {
        void refresh();
      });
    };
  }, [clearUnread, matchedSlug, refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, nextType]);

  if (loading) {
    return <FullscreenLoader />;
  }

  if (error) {
    return <CenteredState>{error}</CenteredState>;
  }

  const isRecording = nextType === 'voice';
  const isSendingVideo = nextType === 'video';
  const isTyping = nextType === 'text';
  const presence = isRecording
    ? 'در حال ضبط صدا…'
    : isSendingVideo
      ? 'در حال ارسال ویدیو…'
      : isTyping
        ? 'در حال نوشتن…'
        : 'آنلاین';

  return (
    <Page>
      <Screen>
        {/* shrink-0 header + min-h-0 scroller + shrink-0 composer keeps the
            chrome pinned while only the message list scrolls. */}
        <header className="z-10 shrink-0 border-b border-app-border bg-app-surface">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="flex w-full items-center gap-3 px-4 py-3 text-right transition-opacity active:opacity-70"
          >
            {profile && (
              <ProtectedImage
                src={profile.photo}
                label={profile.name}
                className="size-11 shrink-0 rounded-full"
              />
            )}

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-app-text">
                {profile?.name ?? 'گفتگو'}
              </span>
              <span
                className={`block text-xs ${
                  isRecording || isSendingVideo ? 'text-brand-soft' : 'text-emerald-400'
                }`}
              >
                {presence}
              </span>
              <span className="mt-0.5 block text-[10px] text-app-muted">
                برای مشاهده پروفایل اینجا بزنید
              </span>
            </span>

            <span aria-hidden className="shrink-0 text-app-muted">
              ‹
            </span>
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => {
            const mine = message.sender === 'user';

            return (
              <div key={message.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
                {message.type === 'video' ? (
                  <div className="max-w-[78%] overflow-hidden rounded-2xl rounded-br-md bg-black">
                    <VideoBubble src={message.videoUrl} label="ویدیو" />
                    <p className="px-3 py-1.5 text-[10px] text-white/70">
                      {formatTime(message.sentAt)}
                    </p>
                  </div>
                ) : (
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                    mine
                      ? 'rounded-bl-md bg-app-surface-2 text-app-text'
                      : 'rounded-br-md bg-gradient-to-bl from-brand to-brand-strong text-white'
                  }`}
                >
                  {message.type === 'voice' ? (
                    <VoiceBubble
                      src={message.audioUrl}
                      durationSec={message.durationSec}
                      tone={mine ? 'onSurface' : 'onBrand'}
                    />
                  ) : (
                    <p className="selectable text-sm leading-7">{message.text}</p>
                  )}
                  <p
                    className={`mt-1.5 text-[10px] ${mine ? 'text-app-muted' : 'text-white/70'}`}
                  >
                    {formatTime(message.sentAt)}
                  </p>
                </div>
                )}
              </div>
            );
          })}

          {nextType && (
            <div className="flex justify-end">
              {isRecording ? (
                <RecordingIndicator />
              ) : isSendingVideo ? (
                <SendingVideoIndicator />
              ) : (
                <TypingIndicator />
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="z-10 shrink-0">
          <Composer onSent={(message) => setMessages((current) => [...current, message])} />
        </div>

        {profileOpen && profile && (
          <PartnerSheet profile={profile} onClose={() => setProfileOpen(false)} />
        )}
      </Screen>
    </Page>
  );
}
