'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Page } from '@/components/Page';
import { useSession } from '@/components/SessionProvider';
import { SearchAnimation } from '@/components/match/SearchAnimation';
import { AmbientBackground, CenteredState, Screen } from '@/components/ui/Screen';
import { findMatch } from '@/lib/api';

/** Scripted search steps. The last one lands right before the chat opens. */
const SEARCH_STEPS: { at: number; text: string }[] = [
  { at: 0, text: 'در حال اتصال به شبکهٔ کاربران…' },
  { at: 1800, text: 'بررسی افراد آنلاین نزدیک شما…' },
  { at: 4000, text: 'تحلیل علاقه‌مندی‌ها و سلیقه…' },
  { at: 6200, text: 'محاسبهٔ میزان تطابق…' },
  { at: 8400, text: 'یک نفر پیدا شد! در حال باز کردن گفتگو…' },
];

const SEARCH_DURATION_MS = 10_000;
const PROGRESS_TICK_MS = 120;

export default function MatchPage() {
  const router = useRouter();
  const { setSession } = useSession();
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    SEARCH_STEPS.forEach((step, index) => {
      if (step.at === 0) {
        return;
      }

      timers.push(
        setTimeout(() => {
          if (!cancelled) {
            setStepIndex(index);
          }
        }, step.at),
      );
    });

    const startedAt = Date.now();
    const progressTimer = setInterval(() => {
      if (cancelled) {
        return;
      }

      const ratio = Math.min(1, (Date.now() - startedAt) / SEARCH_DURATION_MS);
      setProgress(ratio * 100);
    }, PROGRESS_TICK_MS);

    // Keeps the animation on screen long enough to feel like a real search.
    const minimumDelay = new Promise<void>((resolve) => {
      timers.push(setTimeout(resolve, SEARCH_DURATION_MS));
    });

    const run = async () => {
      try {
        const { session } = await findMatch();
        await minimumDelay;

        if (!cancelled) {
          // Refreshes the shared session so the tab bar drops the search
          // button right away instead of after the next app launch.
          setSession(session);
          router.replace('/chat');
        }
      } catch (matchError) {
        if (!cancelled) {
          setError(matchError instanceof Error ? matchError.message : 'خطای ناشناخته');
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      clearInterval(progressTimer);
      timers.forEach(clearTimeout);
    };
  }, [router, setSession]);

  if (error) {
    return <CenteredState>{error}</CenteredState>;
  }

  return (
    <Page>
      <Screen className="px-6">
        <AmbientBackground />
        <div className="relative flex flex-1 flex-col">
          <SearchAnimation text={SEARCH_STEPS[stepIndex].text} progress={progress} />
        </div>
      </Screen>
    </Page>
  );
}
