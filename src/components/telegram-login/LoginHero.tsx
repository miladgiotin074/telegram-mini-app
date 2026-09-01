'use client';

import { useEffect, useRef } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';

type HeroKind =
  | 'laptop'
  | 'sms'
  | 'call'
  | 'flash'
  | 'lock'
  | 'mail'
  | 'inbox'
  | 'heart'
  | 'wait'
  | 'bubble'
  | 'fragment'
  | 'star'
  | 'ok'
  | 'missed';

const SHOW_DELAY_MS = 120;

const LOTTIE: Record<string, { src: string; size: number; loop?: boolean }> = {
  laptop: { src: '/telegram-login/code_laptop.json', size: 128 },
  sms: { src: '/telegram-login/sms_incoming_info.json', size: 64 },
  call: { src: '/telegram-login/sms_incoming_info.json', size: 64 },
  flash: { src: '/telegram-login/phone_flash_call.json', size: 64 },
  lock: { src: '/telegram-login/tsv_setup_intro.json', size: 120 },
  mail: { src: '/telegram-login/tsv_setup_mail.json', size: 120 },
  inbox: { src: '/telegram-login/email_check_inbox.json', size: 120 },
  heart: { src: '/telegram-login/email_setup_heart.json', size: 120 },
  wait: { src: '/telegram-login/sandclock.json', size: 120, loop: true },
  bubble: { src: '/telegram-login/bubble.json', size: 95 },
  fragment: { src: '/telegram-login/fragment.json', size: 36 },
};

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function LoginLottie({ src, size, loop }: { src: string; size: number; loop?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;
    let playTimer = 0;
    let anim: AnimationItem | undefined;

    const start = (item: AnimationItem) => {
      if (prefersReducedMotion()) {
        item.goToAndStop(item.totalFrames, true);
        return;
      }
      playTimer = window.setTimeout(() => {
        item.goToAndPlay(0, true);
      }, SHOW_DELAY_MS);
    };

    void fetch(src)
      .then((response) => response.json())
      .then((animationData: object) => {
        if (cancelled || !containerRef.current) {
          return;
        }

        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: Boolean(loop),
          autoplay: false,
          animationData,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid meet',
          },
        });

        if (anim.isLoaded) {
          start(anim);
        } else {
          anim.addEventListener('DOMLoaded', () => {
            if (anim) {
              start(anim);
            }
          });
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(playTimer);
      anim?.destroy();
    };
  }, [src, loop]);

  return <div ref={containerRef} style={{ width: size, height: size }} />;
}

export function LoginHero({ kind }: { kind: HeroKind | string }) {
  const spec = LOTTIE[kind];

  if (spec) {
    return (
      <div className={`tg-hero tg-hero-${kind}`} aria-hidden>
        <LoginLottie key={spec.src} src={spec.src} size={spec.size} loop={spec.loop} />
      </div>
    );
  }

  return (
    <div className={`tg-hero tg-hero-${kind} tg-hero-fallback`} aria-hidden>
      {kind === 'star' ? (
        <svg viewBox="0 0 64 64">
          <path d="m32 8 6 18h18l-14 11 5 19-15-12-15 12 5-19L8 26h18z" fill="#fff" />
        </svg>
      ) : kind === 'ok' ? (
        <svg viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="22" fill="#31b545" />
          <path d="m22 33 7 7 14-16" fill="none" stroke="#fff" strokeWidth="4" />
        </svg>
      ) : kind === 'missed' ? (
        <svg viewBox="0 0 64 64">
          <path d="M18 42c8 8 20 12 28 8l-6-6c-6 2-14 0-20-6z" fill="#50a8eb" />
          <path d="M40 14v16l12 8" fill="none" stroke="#50a8eb" strokeWidth="4" />
        </svg>
      ) : (
        <span />
      )}
    </div>
  );
}

export function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96L3.97 7.29C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
