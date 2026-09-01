'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Page, usePageBackOverride, usePageBackVisible } from '@/components/Page';
import { useSession } from '@/components/SessionProvider';
import { SlideArt } from '@/components/onboarding/SlideArt';
import { INTRO_LAST, INTRO_SLIDES, loadIntroImage, type IntroSlideId } from '@/components/onboarding/slides';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { AmbientBackground, Screen } from '@/components/ui/Screen';
import { submitOnboarding } from '@/lib/api';
import type { Gender } from '@/lib/types';

const GENDER_OPTIONS: {
  value: Gender;
  label: string;
  caption: string;
  icon: string;
  gradient: string;
}[] = [
  {
    value: 'male',
    label: 'آقا',
    caption: 'دنبال یک خانم می‌گردم',
    icon: '👨',
    gradient: 'from-accent to-indigo-500',
  },
  {
    value: 'female',
    label: 'خانم',
    caption: 'دنبال یک آقا می‌گردم',
    icon: '👩',
    gradient: 'from-brand to-brand-strong',
  },
];

const SWIPE_THRESHOLD_PX = 56;

export default function OnboardingPage() {
  const router = useRouter();
  const { setSession } = useSession();
  const [phase, setPhase] = useState<'intro' | 'gender'>('intro');
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [gender, setGender] = useState<Gender | null>('male');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagesReady, setImagesReady] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<IntroSlideId, boolean>>({
    match: false,
    chat: false,
    private: false,
  });
  const startX = useRef(0);

  useEffect(() => {
    let cancelled = false;

    void Promise.all(
      INTRO_SLIDES.map(async (slide) => {
        const ok = await loadIntroImage(slide.image);
        return [slide.id, ok] as const;
      }),
    ).then((entries) => {
      if (cancelled) {
        return;
      }
      setLoadedImages(Object.fromEntries(entries) as Record<IntroSlideId, boolean>);
      setImagesReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const goIntro = useCallback((next: number) => {
    setIndex(Math.max(0, Math.min(INTRO_LAST, next)));
    setDrag(0);
    setDragging(false);
  }, []);

  usePageBackVisible(phase === 'gender' || index > 0);
  usePageBackOverride(() => {
    if (phase === 'gender') {
      setPhase('intro');
      goIntro(INTRO_LAST);
      return false;
    }
    if (index > 0) {
      goIntro(index - 1);
      return false;
    }
    return false;
  });

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    startX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) {
      return;
    }
    setDrag(event.clientX - startX.current);
  };

  const onPointerUp = () => {
    if (!dragging) {
      return;
    }

    if (drag >= SWIPE_THRESHOLD_PX && index < INTRO_LAST) {
      goIntro(index + 1);
      return;
    }
    if (drag <= -SWIPE_THRESHOLD_PX && index > 0) {
      goIntro(index - 1);
      return;
    }

    setDrag(0);
    setDragging(false);
  };

  const finishIntro = () => {
    setPhase('gender');
    setDrag(0);
    setDragging(false);
  };

  const submit = async () => {
    if (!gender) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { session } = await submitOnboarding(gender);
      setSession(session);
      router.replace('/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'خطای ناشناخته');
      setSubmitting(false);
    }
  };

  return (
    <Page back={false}>
      <Screen>
        <AmbientBackground />

        {phase === 'intro' && !imagesReady ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader />
          </div>
        ) : phase === 'intro' ? (
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="z-10 flex h-14 shrink-0 items-center justify-start px-5">
              {index < INTRO_LAST ? (
                <button
                  type="button"
                  onClick={finishIntro}
                  className="text-sm font-bold text-app-muted transition-colors active:text-app-text"
                >
                  رد شدن
                </button>
              ) : (
                <span />
              )}
            </div>

            <div
              className="min-h-0 flex-1 touch-none overflow-hidden"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div
                className={`flex h-full ${dragging ? '' : 'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'}`}
                style={{
                  width: `${INTRO_SLIDES.length * 100}%`,
                  transform: `translateX(calc(${(index * 100) / INTRO_SLIDES.length}% + ${drag}px))`,
                }}
              >
                {INTRO_SLIDES.map((slide) => (
                  <div
                    key={slide.id}
                    className="flex h-full shrink-0 flex-col items-center justify-center px-8"
                    style={{ width: `${100 / INTRO_SLIDES.length}%` }}
                  >
                    <SlideArt src={slide.image} kind={slide.id} loaded={loadedImages[slide.id]} />
                    <h1 className="mt-8 text-center text-[1.65rem] font-black leading-10 text-app-text">
                      {slide.title}
                    </h1>
                    <p className="mt-3 max-w-xs text-center text-sm leading-7 text-app-muted">
                      {slide.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="z-10 shrink-0 px-6 pb-6 pt-3">
              <div className="mb-5 flex items-center justify-center gap-2">
                {INTRO_SLIDES.map((slide, slideIndex) => {
                  const active = slideIndex === index;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      aria-label={`اسلاید ${slideIndex + 1}`}
                      onClick={() => goIntro(slideIndex)}
                      className={`h-2 rounded-full transition-all ${
                        active ? 'w-7 bg-brand' : 'w-2 bg-app-border'
                      }`}
                    />
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (index >= INTRO_LAST) {
                    finishIntro();
                    return;
                  }
                  goIntro(index + 1);
                }}
                className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-l from-brand to-accent px-6 py-4 text-base font-bold text-white shadow-xl shadow-brand/30 transition-transform active:scale-[0.98]"
              >
                <span className="relative z-10">{index >= INTRO_LAST ? 'شروع کنیم' : 'ادامه'}</span>
                <span
                  aria-hidden
                  className="animate-shimmer absolute inset-y-0 -left-1/3 w-1/3 skew-x-12 bg-white/25 blur-md"
                />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-1 flex-col justify-center gap-8 px-6 py-10">
            <div className="text-center">
              <h1 className="text-[1.65rem] font-black text-app-text">تو کی هستی؟</h1>
              <p className="mt-3 text-sm leading-7 text-app-muted">
                بگو خانمی یا آقا تا جذاب‌ترین گزینهٔ روبه‌رویت را پیدا کنیم.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {GENDER_OPTIONS.map((option) => {
                const selected = gender === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGender(option.value)}
                    className={`relative flex items-center gap-4 overflow-hidden rounded-3xl border p-5 text-right transition-all active:scale-[0.98] ${
                      selected
                        ? 'border-brand bg-app-surface-2 shadow-xl shadow-brand/20'
                        : 'border-app-border bg-app-surface/70 backdrop-blur-sm'
                    }`}
                  >
                    <span
                      className={`flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl text-white ${
                        option.gradient
                      } ${selected ? 'opacity-100' : 'opacity-55'}`}
                    >
                      {option.icon}
                    </span>

                    <span className="flex flex-1 flex-col">
                      <span className={`text-lg font-black ${selected ? 'text-app-text' : 'text-app-muted'}`}>
                        {option.label}
                      </span>
                      <span className="mt-1 text-xs text-app-muted">{option.caption}</span>
                    </span>

                    <span
                      className={`flex size-6 items-center justify-center rounded-full border text-xs ${
                        selected
                          ? 'border-brand bg-brand text-white'
                          : 'border-app-border text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>

            {error && <p className="text-center text-xs text-brand-soft">{error}</p>}

            <Button onClick={submit} disabled={!gender || submitting}>
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                </span>
              ) : (
                'بزن بریم'
              )}
            </Button>
          </div>
        )}
      </Screen>
    </Page>
  );
}
