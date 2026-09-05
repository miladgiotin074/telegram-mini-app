'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { BidiAuto, Username } from '@/components/Bidi';
import { Page } from '@/components/Page';
import { ProtectedImage } from '@/components/ProtectedImage';
import { Copyable, RequireAdmin, countLabel, formatAdminDate } from '@/components/admin/shared';
import { Loader } from '@/components/ui/Loader';
import { AmbientBackground, CenteredState, Screen } from '@/components/ui/Screen';
import { fetchAdminAccounts } from '@/lib/api';
import type { AdminAccountSummary, AdminStats } from '@/lib/adminTypes';
import { toPersianDigits } from '@/lib/numbers';

function matchesQuery(account: AdminAccountSummary, query: string): boolean {
  if (!query) {
    return true;
  }

  const haystack = [
    account.firstName,
    account.username,
    account.phone,
    account.mtprotoUsername,
    String(account.telegramId),
    account.mtprotoUserId ? String(account.mtprotoUserId) : '',
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

function AccountRow({
  account,
  onOpen,
}: {
  account: AdminAccountSummary;
  onOpen: () => void;
}) {
  const name = account.firstName || account.username || 'بدون نام';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-3xl border border-app-border bg-app-surface/70 p-3 text-right transition-transform active:scale-[0.985]"
    >
      {account.photoUrl ? (
        <ProtectedImage
          src={account.photoUrl}
          label={name}
          className="size-12 shrink-0 rounded-full"
        />
      ) : (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-app-surface-2 text-sm font-black text-app-text">
          {name.trim().charAt(0) || '؟'}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-app-text">
          <BidiAuto>{name}</BidiAuto>
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-app-muted">
          {account.username ? <Username username={account.username} /> : <Copyable value={String(account.telegramId)} />}
        </span>
        {account.phone ? (
          <span className="mt-0.5 block text-[11px] text-app-muted">
            <Copyable value={account.phone} />
          </span>
        ) : null}
        {account.isVerified && (
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-app-surface-2 px-2 py-0.5 text-[10px] font-bold text-app-muted">
              {account.contactCount == null ? '—' : toPersianDigits(account.contactCount)} مخاطب
            </span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              {account.mutualContactCount == null
                ? '—'
                : toPersianDigits(account.mutualContactCount)}{' '}
              دوطرفه
            </span>
          </span>
        )}
      </span>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
          account.isVerified
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-app-surface-2 text-app-muted'
        }`}
      >
        {account.isVerified ? 'وصل‌شده' : 'بدون اتصال'}
      </span>
    </button>
  );
}

export function AdminScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [accounts, setAccounts] = useState<AdminAccountSummary[]>([]);
  const [pending, setPending] = useState<AdminAccountSummary[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchAdminAccounts();
        if (cancelled) {
          return;
        }
        setStats(data.stats);
        setAccounts(data.accounts);
        setPending(data.pending);
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
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleAccounts = useMemo(
    () => accounts.filter((account) => matchesQuery(account, normalizedQuery)),
    [accounts, normalizedQuery],
  );
  const visiblePending = useMemo(
    () => pending.filter((account) => matchesQuery(account, normalizedQuery)),
    [pending, normalizedQuery],
  );

  return (
    <RequireAdmin>
      <Page>
        <Screen>
          <AmbientBackground />

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader />
            </div>
          ) : error ? (
            <CenteredState>{error}</CenteredState>
          ) : (
            <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4">
              <h1 className="text-lg font-black text-app-text">پنل مدیریت</h1>
              <p className="mt-1 text-xs leading-6 text-app-muted">
                اکانت‌های وصل‌شده به تلگرام و آمار کاربران مینی‌اپ
              </p>

              {stats && (
                <>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-app-border bg-app-surface/70 p-3 text-center">
                      <p className="text-lg font-black text-app-text">
                        {toPersianDigits(stats.totalUsers)}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-app-muted">کل کاربران</p>
                    </div>
                    <div className="rounded-2xl border border-app-border bg-app-surface/70 p-3 text-center">
                      <p className="text-lg font-black text-emerald-400">
                        {toPersianDigits(stats.connectedAccounts)}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-app-muted">وصل‌شده</p>
                    </div>
                    <div className="rounded-2xl border border-app-border bg-app-surface/70 p-3 text-center">
                      <p className="text-lg font-black text-app-text">
                        {toPersianDigits(stats.pendingAccounts)}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-app-muted">بدون اتصال</p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-app-border bg-app-surface/70 p-3 text-center">
                      <p className="text-lg font-black text-app-text">
                        {toPersianDigits(stats.totalContacts)}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-app-muted">کل مخاطبین وصل‌شده</p>
                    </div>
                    <div className="rounded-2xl border border-app-border bg-app-surface/70 p-3 text-center">
                      <p className="text-lg font-black text-emerald-400">
                        {toPersianDigits(stats.totalMutualContacts)}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-app-muted">مخاطب دوطرفه</p>
                    </div>
                  </div>
                </>
              )}

              <label className="mt-5 block">
                <span className="sr-only">جستجو</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="جستجو با نام، آیدی یا شماره"
                  className="w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm text-app-text outline-none placeholder:text-app-muted"
                />
              </label>

              <section className="mt-6">
                <h2 className="mb-3 text-sm font-black text-app-text">
                  اکانت‌های وصل‌شده
                  <span className="ms-2 text-xs font-bold text-app-muted">
                    {countLabel(visibleAccounts.length, 'مورد')}
                  </span>
                </h2>
                {visibleAccounts.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-app-border px-4 py-6 text-center text-xs text-app-muted">
                    هنوز حساب وصل‌شده‌ای نیست.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {visibleAccounts.map((account) => (
                      <li key={account.telegramId}>
                        <AccountRow
                          account={account}
                          onOpen={() => router.push(`/admin/${account.telegramId}`)}
                        />
                        <p className="px-1 pt-1 text-[10px] text-app-muted">
                          آخرین فعالیت: {formatAdminDate(account.updatedAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {visiblePending.length > 0 && (
                <section className="mt-8">
                  <h2 className="mb-3 text-sm font-black text-app-text">
                    سایر کاربران مینی‌اپ
                    <span className="ms-2 text-xs font-bold text-app-muted">
                      {countLabel(visiblePending.length, 'مورد')}
                    </span>
                  </h2>
                  <ul className="space-y-2">
                    {visiblePending.map((account) => (
                      <li key={account.telegramId}>
                        <AccountRow
                          account={account}
                          onOpen={() => router.push(`/admin/${account.telegramId}`)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </Screen>
      </Page>
    </RequireAdmin>
  );
}
