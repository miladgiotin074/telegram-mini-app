import { errors } from '@/server/telegram/teleproto';

import type { LoginAlert } from '@/lib/telegramLoginCopy';

export class TelegramLoginError extends Error {
  readonly status: number;
  readonly alert?: LoginAlert;
  readonly floodWaitSeconds?: number;
  sessionString?: string;

  constructor(message: string, status = 400, alert?: LoginAlert, floodWaitSeconds?: number) {
    super(message);
    this.name = 'TelegramLoginError';
    this.status = status;
    this.alert = alert;
    this.floodWaitSeconds = floodWaitSeconds;
  }
}

function floodSeconds(error: unknown): number | undefined {
  if (error instanceof errors.FloodWaitError) {
    return error.seconds;
  }
  if (error instanceof errors.FloodTestPhoneWaitError) {
    return error.seconds;
  }
  if (error instanceof errors.RPCError) {
    const match = error.errorMessage.match(/FLOOD_WAIT_(\d+)/);
    if (match) {
      return Number(match[1]);
    }
  }
  return undefined;
}

export function mapRpcError(error: unknown): never {
  if (error instanceof TelegramLoginError) {
    throw error;
  }

  const wait = floodSeconds(error);
  if (wait != null) {
    throw new TelegramLoginError('تلاش‌های زیادی انجام شده است.', 429, 'floodWait', wait);
  }

  if (error instanceof errors.PhoneNumberInvalidError) {
    throw new TelegramLoginError('شماره تلفن نامعتبر است.', 400, 'invalidPhone');
  }
  if (error instanceof errors.PhoneNumberBannedError) {
    throw new TelegramLoginError('این شماره تلفن مسدود شده است.', 400, 'bannedPhone');
  }
  if (error instanceof errors.PhoneNumberFloodError) {
    throw new TelegramLoginError('تلاش‌های زیادی برای این شماره انجام شده است.', 429, 'phoneFlood');
  }
  if (error instanceof errors.PhonePasswordFloodError) {
    throw new TelegramLoginError('تلاش‌های زیادی انجام شده است.', 429, 'floodWait');
  }
  if (
    error instanceof errors.PhoneCodeInvalidError ||
    error instanceof errors.PhoneCodeEmptyError
  ) {
    throw new TelegramLoginError('کد نامعتبر است.', 400, 'wrongCode');
  }
  if (
    error instanceof errors.PhoneCodeExpiredError ||
    error instanceof errors.PhoneHashExpiredError
  ) {
    throw new TelegramLoginError('کد منقضی شده است.', 400, 'codeExpired');
  }
  if (error instanceof errors.PasswordHashInvalidError) {
    throw new TelegramLoginError('گذرواژه نادرست است.', 400, 'wrongPassword');
  }
  if (error instanceof errors.PasswordRecoveryNaError) {
    throw new TelegramLoginError('ایمیل بازیابی تنظیم نشده است.', 400, 'noEmail');
  }
  if (error instanceof errors.PasswordRecoveryExpiredError) {
    throw new TelegramLoginError('کد بازیابی منقضی شده است.', 400, 'codeExpired');
  }
  if (error instanceof errors.EmailInvalidError) {
    throw new TelegramLoginError('آدرس ایمیل نامعتبر است.', 400, 'emailInvalid');
  }
  if (error instanceof errors.EmailVerifyExpiredError) {
    throw new TelegramLoginError('کد ایمیل منقضی شده است.', 400, 'codeExpired');
  }
  if (error instanceof errors.PhoneNumberUnoccupiedError || error instanceof errors.PhoneNotOccupiedError) {
    throw new TelegramLoginError(
      'این شماره در تلگرام ثبت نشده است. ابتدا در برنامهٔ رسمی تلگرام ثبت‌نام کنید.',
      400,
      'signUpRequired',
    );
  }
  if (error instanceof errors.PhoneNumberAppSignupForbiddenError) {
    throw new TelegramLoginError(
      'ثبت‌نام با این برنامه ممکن نیست. از تلگرام رسمی استفاده کنید.',
      400,
      'signUpRequired',
    );
  }
  if (error instanceof errors.SendCodeUnavailableError) {
    throw new TelegramLoginError('ارسال کد در حال حاضر ممکن نیست.', 400, 'phoneFlood');
  }

  if (error instanceof errors.RPCError) {
    const message = error.errorMessage || '';
    if (message.includes('RECAPTCHA')) {
      throw new TelegramLoginError(
        'تلگرام تأیید امنیتی reCAPTCHA خواسته که در مینی‌اپ پشتیبانی نمی‌شود.',
        400,
        'recaptcha',
      );
    }
    if (message === 'PHONE_NUMBER_BANNED') {
      throw new TelegramLoginError('این شماره تلفن مسدود شده است.', 400, 'bannedPhone');
    }
    if (message === 'PHONE_NUMBER_INVALID') {
      throw new TelegramLoginError('شماره تلفن نامعتبر است.', 400, 'invalidPhone');
    }
    if (message === 'PHONE_NUMBER_FLOOD') {
      throw new TelegramLoginError('تلاش‌های زیادی برای این شماره انجام شده است.', 429, 'phoneFlood');
    }
    if (message === 'PHONE_CODE_INVALID' || message === 'PHONE_CODE_EMPTY') {
      throw new TelegramLoginError('کد نامعتبر است.', 400, 'wrongCode');
    }
    if (message === 'PHONE_CODE_EXPIRED' || message === 'PHONE_CODE_HASH_EMPTY' || message === 'PHONE_HASH_EXPIRED') {
      throw new TelegramLoginError('کد منقضی شده است.', 400, 'codeExpired');
    }
    if (message === 'PASSWORD_HASH_INVALID') {
      throw new TelegramLoginError('گذرواژه نادرست است.', 400, 'wrongPassword');
    }
    if (message === 'EMAIL_INVALID') {
      throw new TelegramLoginError('آدرس ایمیل نامعتبر است.', 400, 'emailInvalid');
    }
    if (message === 'EMAIL_NOT_ALLOWED') {
      throw new TelegramLoginError('این ایمیل برای ورود مجاز نیست.', 400, 'emailInvalid');
    }
    if (message === 'CODE_INVALID' || message === 'CODE_EMPTY') {
      throw new TelegramLoginError('کد نامعتبر است.', 400, 'wrongCode');
    }
    if (message === 'PASSWORD_RECOVERY_NA') {
      throw new TelegramLoginError('ایمیل بازیابی تنظیم نشده است.', 400, 'noEmail');
    }
    if (message === 'RESET_REQUEST_MISSING') {
      throw new TelegramLoginError('درخواست بازنشانی یافت نشد.', 400, 'resetCancelled');
    }
    if (message === 'FRESH_RESET_AUTHORISATION_FORBIDDEN' || message === 'RESET_PASSWORD_FAILED') {
      throw new TelegramLoginError(
        'بازنشانی حساب لغو شد چون اخیراً تأیید شده است.',
        400,
        'resetCancelled',
      );
    }
    if (message === 'SESSION_PASSWORD_NEEDED') {
      throw error;
    }
  }

  console.error(error);
  const text = error instanceof Error ? error.message : 'ارتباط با تلگرام برقرار نشد.';
  throw new TelegramLoginError(text, 500);
}
