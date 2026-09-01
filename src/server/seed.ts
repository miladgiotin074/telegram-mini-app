import { Profile } from '@/server/models/Profile';

/**
 * Builds Niloofar's six posts from files in `public/posts`.
 * Images: post1.jpg, post3.jpg, post4.jpg, post6.jpg
 * Videos: post2.mp4, post5.mp4
 */
function niloofarPosts() {
  const captions = [
    'شب‌های تهران',
    'یه ویدیو کوتاه از دیشب',
    'قهوهٔ صبحگاهی',
    'سفر آخر هفته',
    'لحظه‌های خصوصی',
    'غروب کنار دریا',
  ];

  const media = [
    { kind: 'image' as const, file: 'post1.jpg' },
    { kind: 'video' as const, file: 'post2.mp4' },
    { kind: 'image' as const, file: 'post3.jpg' },
    { kind: 'image' as const, file: 'post4.jpg' },
    { kind: 'video' as const, file: 'post5.mp4' },
    { kind: 'image' as const, file: 'post6.jpg' },
  ];

  return media.map((item, index) => ({
    order: index + 1,
    type: item.kind,
    // For videos the grid extracts a frame from the file itself.
    poster: `/posts/${item.file}`,
    url: `/posts/${item.file}`,
    caption: captions[index] ?? '',
    likes: 180 + (index + 1) * 47,
  }));
}

/**
 * Placeholder posts for profiles that do not have real media yet.
 * Files are expected at `public/posts/post-N.jpg` and `video-N.mp4`.
 */
function placeholderPosts(captions: string[]) {
  return [1, 2, 3, 4, 5, 6].map((index) => {
    const isVideo = index === 2 || index === 5;

    return {
      order: index,
      type: isVideo ? ('video' as const) : ('image' as const),
      poster: `/posts/post-${index}.jpg`,
      url: isVideo ? `/posts/video-${index}.mp4` : `/posts/post-${index}.jpg`,
      caption: captions[index - 1] ?? '',
      likes: 180 + index * 47,
    };
  });
}

/**
 * Shared conversation for every match.
 * Replace the files in `public/voices` and `public/chat`, and the text below,
 * whenever the real assets are ready.
 */
function chatScript() {
  return [
    { order: 1, type: 'text' as const, text: 'س' },
    {
      order: 2,
      type: 'voice' as const,
      audioUrl: '/voices/voice-1.ogg',
      durationSec: 5,
    },
    {
      order: 3,
      type: 'voice' as const,
      audioUrl: '/voices/voice-2.ogg',
      durationSec: 8,
    },
    {
      order: 4,
      type: 'voice' as const,
      audioUrl: '/voices/voice-3.ogg',
      durationSec: 6,
    },
    {
      order: 5,
      type: 'text' as const,
      text: 'میتونی منو ی جوری بکنی که تا یه هفته نتونم راه برم؟😋😂',
    },
    {
      order: 6,
      type: 'video' as const,
      videoUrl: '/chat/video.mp4',
      durationSec: 12,
    },
    {
      order: 7,
      type: 'text' as const,
      text: 'نفر قبلی که باهاش اوکی شدم منو اینجوری کرد',
    },
  ];
}

const PROFILE_SEED = [
  {
    slug: 'niloofar',
    name: 'نگار',
    gender: 'female' as const,
    age: 26,
    city: 'تهران',
    bio: 'عاشق شب‌های طولانی، موسیقی آروم و گفتگوهای بی‌پرده. دنبال کسی‌ام که بلد باشه گوش بده.',
    photo: '/profiles/niloofar.jpg',
    interests: ['موسیقی', 'سفر', 'کافه‌گردی', 'فیلم'],
    followers: 12400,
    following: 312,
    posts: niloofarPosts(),
    script: chatScript(),
  },
  {
    slug: 'arash',
    name: 'آرش',
    gender: 'male' as const,
    age: 29,
    city: 'تهران',
    bio: 'اهل ورزش، سفرهای بی‌برنامه و شب‌نشینی‌های طولانی. صادق و بی‌حاشیه.',
    photo: '/profiles/arash.svg',
    interests: ['ورزش', 'سفر', 'کتاب', 'موسیقی'],
    followers: 8900,
    following: 245,
    posts: placeholderPosts([
      'تمرین امروز',
      'یه ویدیو از جاده',
      'کتاب این هفته',
      'سفر شمال',
      'شب‌نشینی',
      'طلوع کوهستان',
    ]),
    script: chatScript(),
  },
];

/** Creates the predefined profiles once, then keeps them in sync on restart. */
export async function ensureProfilesSeeded(): Promise<void> {
  await Promise.all(
    PROFILE_SEED.map((profile) =>
      Profile.updateOne({ slug: profile.slug }, { $set: profile }, { upsert: true }),
    ),
  );
}
