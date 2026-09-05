'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { BidiAuto, Username } from '@/components/Bidi';
import { Page } from '@/components/Page';
import { ProtectedImage } from '@/components/ProtectedImage';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import {
  Copyable,
  RequireAdmin,
  countLabel,
  dialogTypeLabel,
  formatAdminDate,
  genderLabel,
} from '@/components/admin/shared';
import { Loader } from '@/components/ui/Loader';
import { AmbientBackground, CenteredState, Screen } from '@/components/ui/Screen';
import { closeHistoryOverlay } from '@/components/overlay/useHistoryOverlay';
import {
  fetchAdminAccount,
  fetchAdminChats,
  fetchAdminContacts,
  fetchAdminSessions,
  resetAdminSessions,
} from '@/lib/api';
import type {
  AdminAccountDetail,
  AdminDialog,
  AdminLiveProfile,
  AdminPerson,
  AdminTelegramSession,
} from '@/lib/adminTypes';
import { toPersianDigits } from '@/lib/numbers';

type Tab = 'info' | 'contacts' | 'chats' | 'sessions';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'اطلاعات' },
  { id: 'contacts', label: 'مخاطبین' },
  { id: 'chats', label: 'چت‌ها' },
  { id: 'sessions', label: 'نشست‌ها' },
];

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-app-border/70 py-3 last:border-b-0">
      <span className="shrink-0 text-xs text-app-muted">{label}</span>
      <span className="min-w-0 text-left text-sm font-bold text-app-text">{children}</span>
    </div>
  );
}

export function AdminAccountScreen({ telegramId }: { telegramId: number }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('info');
  const [account, setAccount] = useState<AdminAccountDetail | null>(null);
  const [live, setLive] = useState<AdminLiveProfile | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<AdminPerson[] | null>(null);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactsMutual, setContactsMutual] = useState(0);
  const [chats, setChats] = useState<AdminDialog[] | null>(null);
  const [chatsTotal, setChatsTotal] = useState(0);
  const [sessions, setSessions] = useState<AdminTelegramSession[] | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabError, setTabError] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [pendingReset, setPendingReset] = useState<
    { kind: 'all' } | { kind: 'one'; hash: string; label: string } | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!Number.isInteger(telegramId) || telegramId <= 0) {
        setError('شناسه نامعتبر است');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchAdminAccount(telegramId);
        if (cancelled) {
          return;
        }
        setAccount(data.account);
        setLive(data.live);
        setLiveError(data.liveError);
        setError(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'بارگذاری ناموفق بود');
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
  }, [telegramId]);

  const loadContacts = useCallback(async () => {
    if (contacts || !account?.isVerified) {
      return;
    }

    setTabLoading(true);
    setTabError(null);

    try {
      const data = await fetchAdminContacts(telegramId);
      setContacts(data.contacts);
      setContactsTotal(data.total);
      setContactsMutual(data.mutual);
    } catch (loadError) {
      setTabError(loadError instanceof Error ? loadError.message : 'خواندن مخاطبین ناموفق بود');
    } finally {
      setTabLoading(false);
    }
  }, [account?.isVerified, contacts, telegramId]);

  const loadChats = useCallback(async () => {
    if (chats || !account?.isVerified) {
      return;
    }

    setTabLoading(true);
    setTabError(null);

    try {
      const data = await fetchAdminChats(telegramId);
      setChats(data.chats);
      setChatsTotal(data.total);
    } catch (loadError) {
      setTabError(loadError instanceof Error ? loadError.message : 'خواندن چت‌ها ناموفق بود');
    } finally {
      setTabLoading(false);
    }
  }, [account?.isVerified, chats, telegramId]);

  const loadSessions = useCallback(async () => {
    if (sessions || !account?.isVerified) {
      return;
    }

    setTabLoading(true);
    setTabError(null);

    try {
      const data = await fetchAdminSessions(telegramId);
      setSessions(data.sessions);
    } catch (loadError) {
      setTabError(loadError instanceof Error ? loadError.message : 'خواندن نشست‌ها ناموفق بود');
    } finally {
      setTabLoading(false);
    }
  }, [account?.isVerified, sessions, telegramId]);

  useEffect(() => {
    if (tab === 'contacts') {
      void loadContacts();
    }
    if (tab === 'chats') {
      void loadChats();
    }
    if (tab === 'sessions') {
      void loadSessions();
    }
  }, [loadChats, loadContacts, loadSessions, tab]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleContacts = useMemo(() => {
    if (!contacts) {
      return [];
    }
    if (!normalizedQuery) {
      return contacts;
    }
    return contacts.filter((person) =>
      [person.name, person.username, person.phone, person.id].join(' ').toLowerCase().includes(normalizedQuery),
    );
  }, [contacts, normalizedQuery]);

  const visibleChats = useMemo(() => {
    if (!chats) {
      return [];
    }
    if (!normalizedQuery) {
      return chats;
    }
    return chats.filter((chat) =>
      [chat.title, chat.lastMessage, chat.id].join(' ').toLowerCase().includes(normalizedQuery),
    );
  }, [chats, normalizedQuery]);

  const name = live
    ? [live.firstName, live.lastName].filter(Boolean).join(' ') || account?.firstName
    : account?.firstName;
  const displayName = name || account?.username || 'بدون نام';
  const otherSessions = sessions?.filter((session) => !session.current) ?? [];

  const runReset = async () => {
    if (!pendingReset) {
      return;
    }

    setResetBusy(true);
    setTabError(null);

    try {
      const data = await resetAdminSessions(
        telegramId,
        pendingReset.kind === 'one' ? pendingReset.hash : undefined,
      );
      setSessions(data.sessions);
      closeHistoryOverlay();
    } catch (resetError) {
      setTabError(resetError instanceof Error ? resetError.message : 'قطع نشست ناموفق بود');
      closeHistoryOverlay();
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <RequireAdmin>
      <Page>
        <Screen>
          <AmbientBackground />

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader />
            </div>
          ) : error || !account ? (
            <CenteredState>{error || 'کاربر یافت نشد'}</CenteredState>
          ) : (
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 px-5 pt-4">
                <div className="flex items-center gap-3">
                  {account.photoUrl ? (
                    <ProtectedImage
                      src={account.photoUrl}
                      label={displayName}
                      className="size-14 shrink-0 rounded-full"
                    />
                  ) : (
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-app-surface-2 text-lg font-black">
                      {displayName.trim().charAt(0) || '؟'}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="truncate text-base font-black text-app-text">
                      <BidiAuto>{displayName}</BidiAuto>
                    </h1>
                    <p className="mt-0.5 truncate text-xs text-app-muted">
                      {account.username ? (
                        <Username username={account.username} />
                      ) : (
                        <Copyable value={String(account.telegramId)} />
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      account.isVerified
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-app-surface-2 text-app-muted'
                    }`}
                  >
                    {account.isVerified ? 'وصل‌شده' : 'بدون اتصال'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-4 rounded-2xl border border-app-border bg-app-surface/70 p-1">
                  {TABS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setTabError(null);
                        setTab(item.id);
                      }}
                        className={`rounded-xl py-2 text-[11px] font-black transition-colors ${
                        tab === item.id ? 'bg-app-surface-2 text-app-text' : 'text-app-muted'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4">
                {tab === 'info' && (
                  <div className="rounded-3xl border border-app-border bg-app-surface/70 px-4">
                    <InfoRow label="آیدی مینی‌اپ">
                      <Copyable value={String(account.telegramId)} />
                    </InfoRow>
                    <InfoRow label="آیدی تلگرام">
                      <Copyable value={account.mtprotoUserId ? String(account.mtprotoUserId) : ''} />
                    </InfoRow>
                    <InfoRow label="شماره">
                      <Copyable value={live?.phone || account.phone} />
                    </InfoRow>
                    <InfoRow label="یوزرنیم">
                      {live?.username || account.mtprotoUsername || account.username ? (
                        <Username username={live?.username || account.mtprotoUsername || account.username} />
                      ) : (
                        '—'
                      )}
                    </InfoRow>
                    <InfoRow label="نام زنده">
                      <Copyable
                        value={[live?.firstName, live?.lastName].filter(Boolean).join(' ')}
                      />
                    </InfoRow>
                    <InfoRow label="جنسیت">{genderLabel(account.gender)}</InfoRow>
                    <InfoRow label="زبان">
                      <Copyable value={account.languageCode} />
                    </InfoRow>
                    <InfoRow label="پست‌ها">{toPersianDigits(account.posts)}</InfoRow>
                    <InfoRow label="مخاطبین">
                      {account.contactCount == null ? '—' : toPersianDigits(account.contactCount)}
                    </InfoRow>
                    <InfoRow label="مخاطب دوطرفه">
                      {account.mutualContactCount == null
                        ? '—'
                        : toPersianDigits(account.mutualContactCount)}
                    </InfoRow>
                    <InfoRow label="تأیید سن">{account.isAdultConfirmed ? 'بله' : 'خیر'}</InfoRow>
                    <InfoRow label="ثبت">{formatAdminDate(account.createdAt)}</InfoRow>
                    <InfoRow label="بروزرسانی">{formatAdminDate(account.updatedAt)}</InfoRow>
                    {liveError && (
                      <p className="py-3 text-xs leading-6 text-brand-soft">{liveError}</p>
                    )}
                  </div>
                )}

                {(tab === 'contacts' || tab === 'chats') && (
                  <label className="mb-3 block">
                    <span className="sr-only">جستجو</span>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={tab === 'contacts' ? 'جستجوی مخاطب' : 'جستجوی چت'}
                      className="w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm text-app-text outline-none placeholder:text-app-muted"
                    />
                  </label>
                )}

                {tab !== 'info' && !account.isVerified && (
                  <p className="rounded-2xl border border-dashed border-app-border px-4 py-6 text-center text-xs leading-6 text-app-muted">
                    این کاربر هنوز حساب تلگرام را وصل نکرده است.
                  </p>
                )}

                {tab !== 'info' && account.isVerified && tabLoading && (
                  <div className="flex justify-center py-10">
                    <Loader size={72} />
                  </div>
                )}

                {tab !== 'info' && account.isVerified && tabError && (
                  <p className="rounded-2xl border border-brand/20 bg-brand/10 px-4 py-3 text-center text-xs leading-6 text-brand-soft">
                    {tabError}
                  </p>
                )}

                {tab === 'contacts' && account.isVerified && !tabLoading && contacts && (
                  <>
                    <p className="mb-3 text-xs font-bold text-app-muted">
                      {countLabel(contactsTotal, 'مخاطب')}
                      {' · '}
                      {countLabel(contactsMutual, 'دوطرفه')}
                    </p>
                    {visibleContacts.length === 0 ? (
                      <p className="text-center text-xs text-app-muted">مخاطبی پیدا نشد.</p>
                    ) : (
                      <ul className="space-y-2">
                        {visibleContacts.map((person) => (
                          <li
                            key={person.id}
                            className="rounded-3xl border border-app-border bg-app-surface/70 p-3"
                          >
                            <p className="text-sm font-black text-app-text">
                              <BidiAuto>{person.name}</BidiAuto>
                              {person.bot ? (
                                <span className="ms-2 rounded-full bg-app-surface-2 px-2 py-0.5 text-[10px] font-bold text-app-muted">
                                  ربات
                                </span>
                              ) : null}
                              {person.mutual ? (
                                <span className="ms-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                  دوطرفه
                                </span>
                              ) : null}
                            </p>
                            <p className="mt-1 text-[11px] text-app-muted">
                              آیدی: <Copyable value={person.id} />
                            </p>
                            {person.username ? (
                              <p className="mt-0.5 text-[11px] text-app-muted">
                                <Username username={person.username} />
                              </p>
                            ) : null}
                            {person.phone ? (
                              <p className="mt-0.5 text-[11px] text-app-muted">
                                <Copyable value={person.phone} />
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                {tab === 'chats' && account.isVerified && !tabLoading && chats && (
                  <>
                    <p className="mb-3 text-xs font-bold text-app-muted">
                      {countLabel(chatsTotal, 'گفتگو')}
                      {chats.length < chatsTotal
                        ? ` — نمایش ${toPersianDigits(chats.length)} مورد`
                        : ''}
                    </p>
                    {visibleChats.length === 0 ? (
                      <p className="text-center text-xs text-app-muted">گفتگویی پیدا نشد.</p>
                    ) : (
                      <ul className="space-y-2">
                        {visibleChats.map((chat) => (
                          <li key={chat.id}>
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/admin/${telegramId}/chat/${encodeURIComponent(chat.id)}`,
                                )
                              }
                              className="flex w-full flex-col rounded-3xl border border-app-border bg-app-surface/70 p-3 text-right transition-transform active:scale-[0.985]"
                            >
                              <span className="flex items-center gap-2">
                                <span className="min-w-0 flex-1 truncate text-sm font-black text-app-text">
                                  <BidiAuto>{chat.title}</BidiAuto>
                                </span>
                                <span className="shrink-0 rounded-full bg-app-surface-2 px-2 py-0.5 text-[10px] font-bold text-app-muted">
                                  {dialogTypeLabel(chat.type)}
                                </span>
                              </span>
                              <span className="mt-1 line-clamp-2 text-[12px] leading-5 text-app-muted">
                                {chat.lastMessage || 'بدون پیام'}
                              </span>
                              <span className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-app-muted">
                                {chat.members != null && (
                                  <span>{countLabel(chat.members, 'عضو')}</span>
                                )}
                                {chat.unread > 0 && (
                                  <span className="rounded-full bg-brand/15 px-2 py-0.5 font-bold text-brand-soft">
                                    {countLabel(chat.unread, 'خوانده‌نشده')}
                                  </span>
                                )}
                                <span className="ms-auto">{formatAdminDate(chat.lastAt)}</span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                {tab === 'sessions' && account.isVerified && !tabLoading && sessions && (
                  <>
                    <button
                      type="button"
                      disabled={otherSessions.length === 0}
                      onClick={() => setPendingReset({ kind: 'all' })}
                      className="w-full rounded-2xl bg-brand px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-app-surface-2 disabled:text-app-muted disabled:shadow-none"
                    >
                      پایان سایر نشست‌ها
                    </button>
                    <p className="mt-2 mb-4 text-xs leading-6 text-app-muted">
                      نشست مینی‌اپ باقی می‌ماند. بقیه دستگاه‌ها از تلگرام خارج می‌شوند.
                    </p>
                    <p className="mb-3 text-xs font-bold text-app-muted">
                      {countLabel(sessions.length, 'نشست')}
                      {otherSessions.length > 0
                        ? ` · ${countLabel(otherSessions.length, 'نشست دیگر')}`
                        : ''}
                    </p>
                    {sessions.length === 0 ? (
                      <p className="text-center text-xs text-app-muted">نشستی پیدا نشد.</p>
                    ) : (
                      <ul className="space-y-2">
                        {sessions.map((session) => (
                          <li
                            key={session.current ? 'current' : session.hash}
                            className="rounded-3xl border border-app-border bg-app-surface/70 p-3"
                          >
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-app-text">
                                  <BidiAuto>{session.device}</BidiAuto>
                                </p>
                                <p className="mt-0.5 text-[11px] text-app-muted">
                                  {[session.appName, session.appVersion].filter(Boolean).join(' ') ||
                                    'برنامه ناشناس'}
                                  {session.officialApp ? ' · رسمی' : ''}
                                </p>
                                {(session.platform || session.systemVersion) && (
                                  <p className="mt-0.5 text-[11px] text-app-muted">
                                    {[session.platform, session.systemVersion]
                                      .filter(Boolean)
                                      .join(' ')}
                                  </p>
                                )}
                                {(session.ip || session.country || session.region) && (
                                  <p className="mt-0.5 text-[11px] text-app-muted">
                                    <Copyable
                                      value={[session.ip, session.country, session.region]
                                        .filter(Boolean)
                                        .join(' · ')}
                                    />
                                  </p>
                                )}
                                <p className="mt-1 text-[10px] text-app-muted">
                                  آخرین فعالیت: {formatAdminDate(session.activeAt)}
                                </p>
                              </div>
                              {session.current ? (
                                <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                                  فعلی
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPendingReset({
                                      kind: 'one',
                                      hash: session.hash,
                                      label: session.device,
                                    })
                                  }
                                  className="shrink-0 rounded-full bg-brand/15 px-3 py-1 text-[11px] font-bold text-brand-soft transition-transform active:scale-95"
                                >
                                  قطع
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </Screen>
        {pendingReset && (
          <AdminConfirmModal
            title={pendingReset.kind === 'all' ? 'پایان سایر نشست‌ها' : 'قطع این نشست'}
            body={
              pendingReset.kind === 'all'
                ? 'همه دستگاه‌های دیگر این حساب از تلگرام خارج می‌شوند. نشست مینی‌اپ قطع نمی‌شود.'
                : `نشست «${pendingReset.label}» قطع شود؟`
            }
            confirmLabel="قطع کردن"
            busy={resetBusy}
            onConfirm={() => void runReset()}
            onClose={() => setPendingReset(null)}
          />
        )}
      </Page>
    </RequireAdmin>
  );
}
