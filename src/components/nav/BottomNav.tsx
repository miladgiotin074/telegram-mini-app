'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';

import { SearchCoach } from '@/components/nav/SearchCoach';
import { toPersianDigits } from '@/lib/numbers';

export type NavTab = 'home' | 'chats';

/** Home icon: a simple filled house so it reads at small sizes. */
function HomeIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6">
      <path
        d="M12 3.2 3.6 10v10.3a.7.7 0 0 0 .7.7h5v-6h5.4v6h5a.7.7 0 0 0 .7-.7V10Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.7}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6">
      <path
        d="M4 5.8h16v10.4H9.4L4.8 19.6v-3.4H4Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.7}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Tab({
  label,
  active,
  onClick,
  locked,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  locked?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-col items-center gap-1 py-2 transition-colors ${
        locked ? 'pointer-events-none' : ''
      } ${active ? 'text-brand' : 'text-app-muted active:text-app-text'}`}
    >
      {children}
      <span className="text-[10px] font-bold">{label}</span>
      <span
        aria-hidden
        className={`h-0.5 w-6 rounded-full transition-opacity ${
          active ? 'bg-brand opacity-100' : 'opacity-0'
        }`}
      />
    </button>
  );
}

/**
 * Persistent tab bar. In RTL the first child sits on the right, so the order
 * below renders as: chats (right), search (centre), home (left).
 *
 * Search is the app's primary action and is raised above the bar, but it
 * disappears once the user is connected — from then on the chat is the hero.
 */
export function BottomNav({
  active,
  showSearch,
  badge = 0,
  spotlightSearch = false,
  onSearch,
}: {
  active: NavTab;
  showSearch: boolean;
  badge?: number;
  /** First-visit coach: dim everything except search. */
  spotlightSearch?: boolean;
  onSearch?: () => void;
}) {
  const router = useRouter();
  const searchRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    router.prefetch('/');
    router.prefetch('/chats');
  }, [router]);

  // Tab switches replace the current entry so the hardware back button does
  // not walk through every tab tap like a website history stack.
  const goHome = () => {
    if (!spotlightSearch) {
      router.replace('/');
    }
  };
  const goChats = () => {
    if (!spotlightSearch) {
      router.replace('/chats');
    }
  };
  const goSearch = () => {
    onSearch?.();
    router.push('/match');
  };

  // Safe-area padding already comes from `Screen`.
  return (
    <nav className="relative z-20 shrink-0 border-t border-app-border bg-app-surface/95 backdrop-blur">
      {spotlightSearch && showSearch && <SearchCoach anchorRef={searchRef} onSelect={goSearch} />}

      <div
        className={`mx-auto grid max-w-md items-end px-6 ${
          showSearch ? 'grid-cols-3' : 'grid-cols-2'
        }`}
      >
        <Tab label="چت‌ها" active={active === 'chats'} onClick={goChats} locked={spotlightSearch}>
          <span className="relative">
            <ChatIcon filled={active === 'chats'} />
            {badge > 0 && (
              <span className="absolute -right-1.5 -top-1 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-black text-white">
                {badge > 9 ? '۹+' : toPersianDigits(badge)}
              </span>
            )}
          </span>
        </Tab>

        {showSearch && (
          <div className="relative z-50 flex justify-center">
            <button
              ref={searchRef}
              type="button"
              onClick={goSearch}
              aria-label="جستجو"
              className={`relative -mt-7 flex size-16 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full bg-gradient-to-br from-brand to-accent text-white shadow-xl shadow-brand/40 ring-4 ring-app-surface transition-transform active:scale-95 ${
                spotlightSearch ? 'pointer-events-none invisible' : ''
              }`}
            >
              <span
                aria-hidden
                className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-brand-soft/60"
              />
              <span className="relative z-10 text-xl leading-none">🔍</span>
              <span className="relative z-10 text-[9px] font-black">جستجو</span>
            </button>
          </div>
        )}

        <Tab label="خانه" active={active === 'home'} onClick={goHome} locked={spotlightSearch}>
          <HomeIcon filled={active === 'home'} />
        </Tab>
      </div>
    </nav>
  );
}
