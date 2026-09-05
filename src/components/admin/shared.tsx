'use client';

import type { PropsWithChildren } from 'react';

import { BidiLtr } from '@/components/Bidi';
import { Page } from '@/components/Page';
import { useSession } from '@/components/SessionProvider';
import { FullscreenLoader } from '@/components/ui/Loader';
import { CenteredState } from '@/components/ui/Screen';
import { toPersianDigits } from '@/lib/numbers';

export function RequireAdmin({ children }: PropsWithChildren) {
  const { session, loading, error } = useSession();

  if (loading || (!session && !error)) {
    return <FullscreenLoader />;
  }

  if (error) {
    return (
      <Page>
        <CenteredState>{error}</CenteredState>
      </Page>
    );
  }

  if (!session?.isAdmin) {
    return (
      <Page>
        <CenteredState>دسترسی غیرمجاز</CenteredState>
      </Page>
    );
  }

  return children;
}

export function Copyable({ value, className = '' }: { value: string; className?: string }) {
  if (!value) {
    return <span className="text-app-muted">—</span>;
  }

  return (
    <BidiLtr className={`selectable break-all ${className}`}>
      {value}
    </BidiLtr>
  );
}

export function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function dialogTypeLabel(type: 'user' | 'group' | 'channel'): string {
  if (type === 'group') {
    return 'گروه';
  }
  if (type === 'channel') {
    return 'کانال';
  }
  return 'کاربر';
}

export function genderLabel(gender: 'male' | 'female' | null): string {
  if (gender === 'male') {
    return 'آقا';
  }
  if (gender === 'female') {
    return 'خانم';
  }
  return 'نامشخص';
}

export function countLabel(value: number, unit: string): string {
  return `${toPersianDigits(value)} ${unit}`;
}
