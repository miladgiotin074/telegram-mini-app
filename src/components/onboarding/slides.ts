export const INTRO_SLIDES = [
  {
    id: 'match',
    image: '/onboarding/1.png',
    title: 'آدم واقعی، همین حالا',
    text: 'کسی را پیدا کن که آنلاین است و می‌خواهد همین امشب با تو حرف بزند.',
  },
  {
    id: 'chat',
    image: '/onboarding/2.png',
    title: 'چت و ویس، بی‌پرده',
    text: 'پیام بفرست یا ویس بگذار. بدون سانسور، بدون رودربایستی.',
  },
  {
    id: 'private',
    image: '/onboarding/3.png',
    title: 'فقط بین خودتان',
    text: 'گفتگوهایت محرمانه می‌ماند. ورود یعنی تأیید می‌کنی بالای ۱۸ سال هستی.',
  },
] as const;

export const INTRO_LAST = INTRO_SLIDES.length - 1;

export type IntroSlideId = (typeof INTRO_SLIDES)[number]['id'];

export function loadIntroImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(ok);
    };

    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const decoded = image.decode ? image.decode() : Promise.resolve();
      void decoded.then(() => finish(true)).catch(() => finish(true));
    };
    image.onerror = () => finish(false);
    image.src = src;

    if (image.complete && image.naturalWidth > 0) {
      const decoded = image.decode ? image.decode() : Promise.resolve();
      void decoded.then(() => finish(true)).catch(() => finish(true));
    }
  });
}
