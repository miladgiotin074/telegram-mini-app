import { retrieveRawInitData } from '@tma.js/sdk-react';

import type { LoginAlert, LoginPage } from '@/lib/telegramLoginCopy';
import type { Session } from '@/lib/types';

export type TelegramLoginRequest =
  | { action: 'sendCode'; phone: string }
  | { action: 'submitCode'; loginId: string; code: string }
  | { action: 'resend'; loginId: string }
  | { action: 'password'; loginId: string; password: string }
  | { action: 'requestRecovery'; loginId: string }
  | { action: 'submitRecoveryCode'; loginId: string; code: string }
  | { action: 'setNewPassword'; loginId: string; password: string; password2: string }
  | { action: 'finishNewPassword'; loginId: string; hint: string }
  | { action: 'resetPassword'; loginId: string }
  | { action: 'sendEmail'; loginId: string; email: string }
  | { action: 'submitEmailCode'; loginId: string; code: string }
  | { action: 'resetEmail'; loginId: string }
  | { action: 'checkPaid'; loginId: string }
  | { action: 'cancel'; loginId: string };

export type TelegramLoginResponse = {
  loginId: string;
  page: LoginPage;
  timeout: number;
  codeLength: number;
  nextType: LoginPage | null;
  missedPrefix?: string;
  fragmentUrl?: string;
  wordBeginning?: string;
  emailPattern?: string;
  googleSigninAllowed?: boolean;
  appleSigninAllowed?: boolean;
  passwordHint?: string;
  hasRecovery?: boolean;
  recoveryEmailPattern?: string;
  resetWaitUntil?: string | null;
  done?: boolean;
  session?: Session;
};

export class TelegramLoginApiError extends Error {
  readonly alert?: LoginAlert;
  readonly floodWaitSeconds?: number;

  constructor(message: string, alert?: LoginAlert, floodWaitSeconds?: number) {
    super(message);
    this.name = 'TelegramLoginApiError';
    this.alert = alert;
    this.floodWaitSeconds = floodWaitSeconds;
  }
}

function authHeader(): string {
  try {
    return `tma ${retrieveRawInitData() || ''}`;
  } catch {
    return 'tma ';
  }
}

export async function telegramLogin(body: TelegramLoginRequest): Promise<TelegramLoginResponse> {
  const response = await fetch('/api/telegram-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as TelegramLoginResponse & {
    error?: string;
    alert?: LoginAlert;
    floodWaitSeconds?: number;
  };

  if (!response.ok) {
    throw new TelegramLoginApiError(
      payload.error || 'درخواست ناموفق بود',
      payload.alert,
      payload.floodWaitSeconds,
    );
  }

  return payload;
}
