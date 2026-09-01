export type Gender = 'male' | 'female';

export const MAX_USER_POSTS = 6;

export type ProfilePost = {
  order: number;
  type: 'image' | 'video';
  poster: string;
  url: string;
  caption: string;
  likes: number;
};

export type Session = {
  telegramId: number;
  firstName: string;
  username: string;
  photoUrl: string;
  gender: Gender | null;
  isAdultConfirmed: boolean;
  isVerified: boolean;
  telegramLoginRequired: boolean;
  matchedProfileSlug: string | null;
  posts: ProfilePost[];
};

export type MatchProfile = {
  slug: string;
  name: string;
  gender: Gender;
  age: number;
  city: string;
  bio: string;
  photo: string;
  interests: string[];
  followers: number;
  following: number;
  posts: ProfilePost[];
};

export type ChatListItem = {
  slug: string;
  name: string;
  photo: string;
  lastMessage: {
    type: 'text' | 'voice' | 'video';
    text: string;
    fromMe: boolean;
    sentAt: string;
  };
  /** Scripted messages still waiting to be delivered. */
  pending: number;
  /** Delivered profile messages the user has not opened yet. */
  unread: number;
  /** Partner is actively typing, recording, or sending a video. */
  activity: 'typing' | 'recording' | 'sending' | null;
};

export type ChatMessage = {
  id: string;
  sender: 'profile' | 'user';
  type: 'text' | 'voice' | 'video';
  text: string;
  audioUrl: string;
  videoUrl: string;
  durationSec: number;
  sentAt: string;
};
