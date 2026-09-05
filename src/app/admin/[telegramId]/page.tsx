'use client';

import { use } from 'react';

import { AdminAccountScreen } from '@/components/admin/AdminAccountScreen';

export default function AdminAccountPage({
  params,
}: {
  params: Promise<{ telegramId: string }>;
}) {
  const { telegramId } = use(params);
  return <AdminAccountScreen telegramId={Number(telegramId)} />;
}
