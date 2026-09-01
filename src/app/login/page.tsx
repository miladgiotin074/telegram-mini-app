'use client';

import { useEffect, useRef } from 'react';

import { useTelegramLoginGate } from '@/components/telegram-login/TelegramLoginGate';

export default function LoginPage() {
  const { openTelegramLogin } = useTelegramLoginGate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    void openTelegramLogin();
  }, [openTelegramLogin]);

  return null;
}
