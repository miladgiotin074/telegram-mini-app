import type { MessageDoc } from '@/server/models/Message';
import type { ProfileDoc } from '@/server/models/Profile';
import type { UserDoc } from '@/server/models/User';

export const MAX_USER_POSTS = 6;

export type SessionPayload = {
  telegramId: number;
  firstName: string;
  username: string;
  photoUrl: string;
  gender: 'male' | 'female' | null;
  isAdultConfirmed: boolean;
  isVerified: boolean;
  telegramLoginRequired: boolean;
  matchedProfileSlug: string | null;
  posts: PublicPost[];
};

export type PublicPost = {
  order: number;
  type: 'image' | 'video';
  poster: string;
  url: string;
  caption: string;
  likes: number;
};

export type PublicProfile = {
  slug: string;
  name: string;
  gender: string;
  age: number;
  city: string;
  bio: string;
  photo: string;
  interests: string[];
  followers: number;
  following: number;
  posts: PublicPost[];
};

export type PublicMessage = {
  id: string;
  sender: 'profile' | 'user';
  type: 'text' | 'voice' | 'video';
  text: string;
  audioUrl: string;
  videoUrl: string;
  durationSec: number;
  sentAt: string;
};

export function toSession(user: UserDoc): SessionPayload {
  return {
    telegramId: user.telegramId,
    firstName: user.firstName ?? '',
    username: user.username ?? '',
    photoUrl: user.photoUrl ?? '',
    gender: user.gender ?? null,
    isAdultConfirmed: Boolean(user.isAdultConfirmed),
    isVerified: Boolean(user.isVerified),
    telegramLoginRequired: Boolean(user.telegramLoginRequired),
    matchedProfileSlug: user.matchedProfileSlug ?? null,
    posts: toPublicUserPosts(user),
  };
}

/** User uploads reuse the profile post shape so the same grid can render them. */
export function toPublicUserPosts(user: UserDoc): PublicPost[] {
  const url = (uploadId: string) => `/api/uploads/${uploadId}`;

  return [...(user.posts ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((post) => ({
      order: post.order,
      type: post.type as 'image' | 'video',
      poster: url(post.uploadId),
      url: url(post.uploadId),
      caption: '',
      likes: 0,
    }));
}

export function toPublicProfile(profile: ProfileDoc): PublicProfile {
  return {
    slug: profile.slug,
    name: profile.name,
    gender: profile.gender,
    age: profile.age,
    city: profile.city ?? '',
    bio: profile.bio ?? '',
    photo: profile.photo ?? '',
    interests: profile.interests ?? [],
    followers: profile.followers ?? 0,
    following: profile.following ?? 0,
    posts: [...(profile.posts ?? [])]
      .sort((a, b) => a.order - b.order)
      .map((post) => ({
        order: post.order,
        type: post.type as 'image' | 'video',
        poster: post.poster,
        url: post.url || post.poster,
        caption: post.caption ?? '',
        likes: post.likes ?? 0,
      })),
  };
}

export function toPublicMessage(message: MessageDoc & { _id: unknown }): PublicMessage {
  return {
    id: String(message._id),
    sender: message.sender as 'profile' | 'user',
    type: message.type as 'text' | 'voice' | 'video',
    text: message.text ?? '',
    audioUrl: message.audioUrl ?? '',
    videoUrl: message.videoUrl ?? '',
    durationSec: message.durationSec ?? 0,
    sentAt: new Date(message.deliverAt).toISOString(),
  };
}
