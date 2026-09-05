'use client';

import { use } from 'react';

import { AdminChatScreen } from '@/components/admin/AdminChatScreen';

export default function AdminChatPage({
  params,
}: {
  params: Promise<{ telegramId: string; peerId: string }>;
}) {
  const { telegramId, peerId } = use(params);
  return (
    <AdminChatScreen
      telegramId={Number(telegramId)}
      peerId={decodeURIComponent(peerId)}
    />
  );
}
