'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BidiAuto, Username } from '@/components/Bidi';
import { useChats } from '@/components/ChatsProvider';
import { Page } from '@/components/Page';
import { ProtectedImage } from '@/components/ProtectedImage';
import { useSession } from '@/components/SessionProvider';
import { BottomNav } from '@/components/nav/BottomNav';
import { EditablePostGrid } from '@/components/profile/EditablePostGrid';
import { MediaViewer } from '@/components/profile/MediaViewer';
import { ConnectAccountModal } from '@/components/telegram-login/ConnectAccountModal';
import { useTelegramLoginGate } from '@/components/telegram-login/TelegramLoginGate';
import { FullscreenLoader } from '@/components/ui/Loader';
import { AmbientBackground, CenteredState, Screen } from '@/components/ui/Screen';
import { deletePost, uploadPost } from '@/lib/api';
import { toPersianDigits } from '@/lib/numbers';
import { hasSeenSearchCoach, markSearchCoachSeen } from '@/lib/searchCoach';
import type { Session } from '@/lib/types';

function TelegramGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="currentColor"
        d="M21.5 3.4 2.7 10.6c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 11.2-7.1c.5-.3 1-.1.6.3l-9 8.6-.4 4.8c.5 0 .8-.2 1.1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.8-.8l3.1-14.8c.3-1.3-.5-1.9-1.5-1.5Z"
      />
    </svg>
  );
}

function Monogram({ name }: { name: string }) {
  return (
    <span className="flex size-20 items-center justify-center rounded-full border-2 border-app-bg bg-gradient-to-br from-brand via-brand-strong to-accent text-2xl font-black text-white">
      {name.trim().charAt(0) || '؟'}
    </span>
  );
}

export function HomeScreen({ active }: { active: boolean }) {
  const router = useRouter();
  const { session, loading, error, setSession } = useSession();
  const { openTelegramLogin } = useTelegramLoginGate();
  const { incoming } = useChats();
  const [busy, setBusy] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchCoach, setSearchCoach] = useState(false);

  const needsOnboarding = Boolean(session && (!session.gender || !session.isAdultConfirmed));
  const isConnected = Boolean(session?.matchedProfileSlug);

  useEffect(() => {
    if (active && needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [active, needsOnboarding, router]);

  useEffect(() => {
    if (!active || !session || needsOnboarding || isConnected) {
      setSearchCoach(false);
      return;
    }

    setSearchCoach(!hasSeenSearchCoach());
  }, [active, session, needsOnboarding, isConnected]);

  const runPostAction = async (action: () => Promise<{ session: Session }>) => {
    setBusy(true);
    setActionError(null);

    try {
      const result = await action();
      setSession(result.session);
    } catch (postError) {
      setActionError(postError instanceof Error ? postError.message : 'عملیات ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  if (loading || (!session && !error)) {
    return <FullscreenLoader />;
  }

  if (error) {
    return <CenteredState>{error}</CenteredState>;
  }

  if (!session || needsOnboarding) {
    return <FullscreenLoader />;
  }

  const displayName = session.firstName || session.username || 'کاربر';

  return (
    <Page back={false} active={active}>
      <Screen>
        <AmbientBackground />

        <div
          className={`relative min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-5 ${
            searchCoach ? 'pointer-events-none' : ''
          }`}
        >
          {/* Identity card: avatar, name and status chips in one tidy frame. */}
          <div className="rounded-3xl border border-app-border bg-app-surface/70 p-4">
            <div className="flex items-center gap-4">
              {session.photoUrl ? (
                <button
                  type="button"
                  onClick={() => setPhotoOpen(true)}
                  aria-label="نمایش عکس پروفایل"
                  className="shrink-0 rounded-full bg-gradient-to-tr from-brand via-brand-strong to-accent p-[3px] transition-transform active:scale-95"
                >
                  <ProtectedImage
                    src={session.photoUrl}
                    label={displayName}
                    className="size-[68px] rounded-full border-2 border-app-surface"
                  />
                </button>
              ) : (
                <span className="shrink-0 rounded-full bg-gradient-to-tr from-brand via-brand-strong to-accent p-[3px]">
                  <Monogram name={displayName} />
                </span>
              )}

              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-base font-black leading-6 text-app-text">
                  <BidiAuto>{displayName}</BidiAuto>
                </p>

                {/* Inline so the LTR handle starts at the RTL line start. */}
                {session.username && (
                  <p className="-mt-0.5 truncate text-xs leading-4 text-app-muted">
                    <Username username={session.username} />
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-app-surface-2 px-2.5 py-1 text-[10px] font-bold text-app-muted">
                    {toPersianDigits(session.posts.length)} پست
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                    آنلاین
                  </span>
                  {session.isVerified && (
                    <span className="rounded-full bg-[#50A8EB]/15 px-2.5 py-1 text-[10px] font-bold text-[#50A8EB]">
                      تأییدشده
                    </span>
                  )}
                  {isConnected && (
                    <span className="rounded-full bg-brand/15 px-2.5 py-1 text-[10px] font-bold text-brand-soft">
                      متصل
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!session.isVerified && (
            <button
              type="button"
              onClick={() => setConnectOpen(true)}
              className="relative mt-4 flex w-full items-center gap-3 overflow-hidden rounded-3xl border border-[#50A8EB]/25 bg-gradient-to-l from-[#50A8EB]/15 to-app-surface p-4 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-transform active:scale-[0.985]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -left-6 top-0 size-24 rounded-full bg-[#50A8EB]/20 blur-2xl"
              />
              <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#50A8EB] text-white shadow-lg shadow-[#50A8EB]/35">
                <TelegramGlyph />
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="block text-[15px] font-black text-app-text">حساب تلگرام را وصل کن</span>
                <span className="mt-1 block text-[12px] leading-6 text-app-muted">
                  با حساب واقعی پیام و ویس بفرست و از اکانت‌های فیک دور بمان.
                </span>
              </span>
              <span className="relative shrink-0 rounded-full bg-[#50A8EB] px-3 py-1.5 text-[11px] font-bold text-white">
                وصل کردن
              </span>
            </button>
          )}

          <div className="mt-6">
            <EditablePostGrid
              posts={session.posts}
              busy={busy}
              onUpload={(file) => void runPostAction(() => uploadPost(file))}
              onDelete={(order) => void runPostAction(() => deletePost(order))}
            />
          </div>

          {actionError && (
            <p className="mt-3 text-center text-xs text-brand-soft">{actionError}</p>
          )}
        </div>

        <BottomNav
          active="home"
          showSearch={!isConnected}
          badge={incoming}
          spotlightSearch={searchCoach}
          onSearch={() => {
            markSearchCoachSeen();
            setSearchCoach(false);
          }}
        />

        {photoOpen && session.photoUrl && (
          <MediaViewer
            media={{ type: 'image', url: session.photoUrl, poster: session.photoUrl }}
            onClose={() => setPhotoOpen(false)}
          />
        )}
        {connectOpen && (
          <ConnectAccountModal
            onConnect={() => {
              setConnectOpen(false);
              void openTelegramLogin({ next: '/' });
            }}
            onClose={() => setConnectOpen(false)}
          />
        )}
      </Screen>
    </Page>
  );
}
