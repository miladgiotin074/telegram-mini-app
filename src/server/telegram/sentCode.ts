import type { Api as TelegramApi } from 'teleproto';
import { Api } from '@/server/telegram/teleproto';

import type { LoginPage } from '@/lib/telegramLoginCopy';

export type MappedSentCode = {
  page: LoginPage;
  phoneCodeHash: string;
  nextType: LoginPage | null;
  timeout: number;
  codeLength: number;
  missedPrefix?: string;
  fragmentUrl?: string;
  wordBeginning?: string;
  emailPattern?: string;
  googleSigninAllowed?: boolean;
  appleSigninAllowed?: boolean;
};

export function tlClassName(value: unknown): string {
  if (
    value &&
    typeof value === 'object' &&
    'className' in value &&
    typeof (value as { className: unknown }).className === 'string'
  ) {
    return (value as { className: string }).className;
  }
  return '';
}

export function isTl(value: unknown, className: string): boolean {
  return tlClassName(value) === className;
}

export function isSentCodeSuccess(value: unknown): value is TelegramApi.auth.SentCodeSuccess {
  return value instanceof Api.auth.SentCodeSuccess || isTl(value, 'auth.SentCodeSuccess');
}

function isSentCode(value: unknown): value is TelegramApi.auth.SentCode {
  if (value instanceof Api.auth.SentCode || isTl(value, 'auth.SentCode')) {
    return true;
  }
  return (
    value != null &&
    typeof value === 'object' &&
    'phoneCodeHash' in value &&
    'type' in value &&
    !isTl(value, 'auth.SentCodeSuccess') &&
    !isTl(value, 'auth.SentCodePaymentRequired')
  );
}

function readNumber(value: object, key: string, fallback: number) {
  const field = (value as Record<string, unknown>)[key];
  return typeof field === 'number' && field > 0 ? field : fallback;
}

function readString(value: object, key: string) {
  const field = (value as Record<string, unknown>)[key];
  return typeof field === 'string' && field ? field : undefined;
}

function readBool(value: object, key: string) {
  return Boolean((value as Record<string, unknown>)[key]);
}

function mapNextType(next?: TelegramApi.auth.TypeCodeType): LoginPage | null {
  if (!next) {
    return null;
  }
  const name = tlClassName(next);
  if (next instanceof Api.auth.CodeTypeSms || name === 'auth.CodeTypeSms') {
    return 'sms';
  }
  if (next instanceof Api.auth.CodeTypeCall || name === 'auth.CodeTypeCall') {
    return 'call';
  }
  if (next instanceof Api.auth.CodeTypeFlashCall || name === 'auth.CodeTypeFlashCall') {
    return 'flash';
  }
  if (next instanceof Api.auth.CodeTypeMissedCall || name === 'auth.CodeTypeMissedCall') {
    return 'missed';
  }
  if (next instanceof Api.auth.CodeTypeFragmentSms || name === 'auth.CodeTypeFragmentSms') {
    return 'fragment';
  }
  return null;
}

function fromSentCode(sent: TelegramApi.auth.SentCode): MappedSentCode {
  const type = sent.type;
  const name = tlClassName(type);
  const nextType = mapNextType(sent.nextType);
  const timeout = sent.timeout ?? 0;
  const base = {
    phoneCodeHash: sent.phoneCodeHash,
    nextType,
    timeout,
  };

  if (type instanceof Api.auth.SentCodeTypeApp || name === 'auth.SentCodeTypeApp') {
    return { ...base, page: 'app', codeLength: readNumber(type, 'length', 5) };
  }
  if (type instanceof Api.auth.SentCodeTypeSms || name === 'auth.SentCodeTypeSms') {
    return { ...base, page: 'sms', codeLength: readNumber(type, 'length', 5) };
  }
  if (type instanceof Api.auth.SentCodeTypeCall || name === 'auth.SentCodeTypeCall') {
    return { ...base, page: 'call', codeLength: readNumber(type, 'length', 5) };
  }
  if (type instanceof Api.auth.SentCodeTypeFlashCall || name === 'auth.SentCodeTypeFlashCall') {
    return { ...base, page: 'flash', codeLength: 0, missedPrefix: readString(type, 'pattern') };
  }
  if (type instanceof Api.auth.SentCodeTypeMissedCall || name === 'auth.SentCodeTypeMissedCall') {
    return {
      ...base,
      page: 'missed',
      codeLength: readNumber(type, 'length', 4),
      missedPrefix: readString(type, 'prefix'),
    };
  }
  if (type instanceof Api.auth.SentCodeTypeFragmentSms || name === 'auth.SentCodeTypeFragmentSms') {
    return {
      ...base,
      page: 'fragment',
      codeLength: readNumber(type, 'length', 5),
      fragmentUrl: readString(type, 'url'),
    };
  }
  if (type instanceof Api.auth.SentCodeTypeSmsWord || name === 'auth.SentCodeTypeSmsWord') {
    return { ...base, page: 'word', codeLength: 0, wordBeginning: readString(type, 'beginning') };
  }
  if (type instanceof Api.auth.SentCodeTypeSmsPhrase || name === 'auth.SentCodeTypeSmsPhrase') {
    return { ...base, page: 'phrase', codeLength: 0, wordBeginning: readString(type, 'beginning') };
  }
  if (type instanceof Api.auth.SentCodeTypeEmailCode || name === 'auth.SentCodeTypeEmailCode') {
    return {
      ...base,
      page: 'emailCode',
      codeLength: readNumber(type, 'length', 6),
      emailPattern: readString(type, 'emailPattern'),
      googleSigninAllowed: readBool(type, 'googleSigninAllowed'),
      appleSigninAllowed: readBool(type, 'appleSigninAllowed'),
    };
  }
  if (
    type instanceof Api.auth.SentCodeTypeSetUpEmailRequired ||
    name === 'auth.SentCodeTypeSetUpEmailRequired'
  ) {
    return {
      ...base,
      page: 'email',
      codeLength: 0,
      googleSigninAllowed: readBool(type, 'googleSigninAllowed'),
      appleSigninAllowed: readBool(type, 'appleSigninAllowed'),
    };
  }
  if (type instanceof Api.auth.SentCodeTypeFirebaseSms || name === 'auth.SentCodeTypeFirebaseSms') {
    return { ...base, page: 'sms', codeLength: readNumber(type, 'length', 5) };
  }

  return { ...base, page: 'sms', codeLength: 5 };
}

export function mapSentCodeResult(sent: TelegramApi.auth.TypeSentCode): MappedSentCode {
  if (sent instanceof Api.auth.SentCodePaymentRequired || isTl(sent, 'auth.SentCodePaymentRequired')) {
    const paid = sent as TelegramApi.auth.SentCodePaymentRequired;
    return {
      page: 'pay',
      phoneCodeHash: paid.phoneCodeHash,
      nextType: 'sms',
      timeout: 0,
      codeLength: 0,
    };
  }

  if (isSentCode(sent)) {
    return fromSentCode(sent);
  }

  throw new Error(`Unexpected sent-code type ${tlClassName(sent) || typeof sent}`);
}

export function isFirebaseSentCode(
  sent: TelegramApi.auth.TypeSentCode,
): sent is TelegramApi.auth.SentCode {
  if (!isSentCode(sent)) {
    return false;
  }
  const type = sent.type;
  return (
    type instanceof Api.auth.SentCodeTypeFirebaseSms || tlClassName(type) === 'auth.SentCodeTypeFirebaseSms'
  );
}
