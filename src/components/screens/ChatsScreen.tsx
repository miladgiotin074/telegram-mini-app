'use client';

import { useRouter } from 'next/navigation';

import { useChats } from '@/components/ChatsProvider';
import { Page } from '@/components/Page';
import { ProtectedImage } from '@/components/ProtectedImage';
import { useSession } from '@/components/SessionProvider';
import { BottomNav } from '@/components/nav/BottomNav';
import { AmbientBackground, Screen } from '@/components/ui/Screen';
import { toPersianDigits } from '@/lib/numbers';
import type { ChatListItem } from '@/lib/types';

/** Relative time, kept short enough for a list row. */
function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  if (minutes < 1) {
    return 'همین حالا';
  }
  if (minutes < 60) {
    return `${toPersianDigits(minutes)} دقیقه پیش`;
  }
  if (minutes < 60 * 24) {
    return `${toPersianDigits(Math.floor(minutes / 60))} ساعت پیش`;
  }

  return `${toPersianDigits(Math.floor(minutes / 1440))} روز پیش`;
}

function preview(chat: ChatListItem): string {
  const body =
    chat.lastMessage.type === 'voice'
      ? '🎤 پیام صوتی'
      : chat.lastMessage.type === 'video'
        ? '🎬 ویدیو'
        : chat.lastMessage.text;

  return chat.lastMessage.fromMe ? `شما: ${body}` : body;
}

export function ChatsScreen({ active }: { active: boolean }) {
  const router = useRouter();
  const { session } = useSession();
  const { chats, incoming, error } = useChats();
  const showSearch = !session?.matchedProfileSlug;

  return (
    <Page back={false} active={active}>
      <Screen>
        <AmbientBackground />

        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-6">
          <h1 className="mb-4 text-lg font-black text-app-text">چت‌ها</h1>

          {error ? (
            <p className="mt-8 text-center text-sm text-app-muted">{error}</p>
          ) : chats.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 text-center">
              <span className="flex size-20 items-center justify-center rounded-full bg-app-surface text-3xl">
                💬
              </span>
              <p className="text-sm font-bold text-app-text">هنوز گفتگویی نداری</p>
              <p className="max-w-xs text-xs leading-6 text-app-muted">
                دکمهٔ جستجو را بزن تا کسی را برایت پیدا کنیم و گفتگو شروع شود.
              </p>
              <button
                type="button"
                onClick={() => router.push('/match')}
                className="mt-2 rounded-full bg-gradient-to-l from-brand to-accent px-6 py-3 text-sm font-black text-white shadow-lg shadow-brand/30 transition-transform active:scale-95"
              >
                🔍 شروع جستجو
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {chats.map((chat) => (
                <li key={chat.slug}>
                  <button
                    type="button"
                    onClick={() => router.push('/chat')}
                    className="flex w-full items-center gap-3 rounded-2xl border border-app-border bg-app-surface p-3 text-right transition-colors active:bg-app-surface-2"
                  >
                    <span className="relative shrink-0">
                      <ProtectedImage
                        src={chat.photo}
                        label={chat.name}
                        className="size-14 rounded-full"
                      />
                      <span
                        aria-hidden
                        className="absolute bottom-0.5 left-0.5 size-3.5 rounded-full border-2 border-app-surface bg-emerald-400"
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-black text-app-text">
                          {chat.name}
                        </span>
                        <span className="shrink-0 text-[10px] text-app-muted">
                          {timeAgo(chat.lastMessage.sentAt)}
                        </span>
                      </span>

                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-app-muted">
                          {chat.activity === 'recording'
                            ? 'در حال ضبط صدا…'
                            : chat.activity === 'sending'
                              ? 'در حال ارسال ویدیو…'
                              : chat.activity === 'typing'
                                ? 'در حال نوشتن…'
                                : preview(chat)}
                        </span>
                        {chat.unread > 0 && (
                          <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-black text-white">
                            {toPersianDigits(chat.unread)}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <BottomNav active="chats" showSearch={showSearch} badge={incoming} />
      </Screen>
    </Page>
  );
}
