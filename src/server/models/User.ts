import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];

/** Media the user uploaded to their own profile grid. */
const userPostSchema = new Schema(
  {
    order: { type: Number, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    /** Points at an `Upload` document, served via `/api/uploads/<id>`. */
    uploadId: { type: String, required: true },
    mimeType: { type: String, default: '' },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    telegramId: { type: Number, required: true, unique: true, index: true },
    firstName: { type: String, default: '' },
    username: { type: String, default: '' },
    languageCode: { type: String, default: '' },
    /** Avatar coming from Telegram init data, when the client provides one. */
    photoUrl: { type: String, default: '' },
    posts: { type: [userPostSchema], default: [] },
    gender: { type: String, enum: GENDERS, default: null },
    isAdultConfirmed: { type: Boolean, default: false },
    /**
     * Filled once the user runs a search. Everyone is matched with the same
     * predefined profile for their preferred gender.
     */
    matchedProfileSlug: { type: String, default: null },
    matchedAt: { type: Date, default: null },
    /**
     * Per-conversation last time the user opened the thread. Unread badges
     * count profile messages delivered after this timestamp.
     */
    chatReadAt: { type: Map, of: Date, default: () => new Map() },
    /**
     * True after a successful MTProto phone login. The session string itself
     * is never sent to the client.
     */
    isVerified: { type: Boolean, default: false },
    /**
     * Once the Telegram login screen has been shown, the rest of the app stays
     * locked until MTProto login succeeds — including after the Mini App is closed.
     */
    telegramLoginRequired: { type: Boolean, default: false },
    /** Serialized teleproto StringSession. Never expose this over the API. */
    mtprotoSession: { type: String, default: '', select: false },
    mtprotoUserId: { type: Number, default: null },
    mtprotoPhone: { type: String, default: '' },
    mtprotoUsername: { type: String, default: '' },
    /** AES-256-GCM encrypted Telegram 2FA password. Never expose over the API. */
    mtproto2faEnc: { type: String, default: '', select: false },
    mtproto2faUpdatedAt: { type: Date, default: null },
    contactCount: { type: Number, default: 0 },
    mutualContactCount: { type: Number, default: 0 },
    contactsSyncedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) || model<UserDoc>('User', userSchema);

/** Last time this conversation was opened, or null if it was never read. */
export function conversationReadAt(user: UserDoc, slug: string): Date | null {
  const raw = user.chatReadAt as Map<string, Date> | Record<string, Date> | undefined;

  if (!raw) {
    return null;
  }

  const value = raw instanceof Map ? raw.get(slug) : raw[slug];
  return value ? new Date(value) : null;
}
