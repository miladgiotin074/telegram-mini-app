import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

import { GENDERS } from '@/server/models/User';

const scriptedMessageSchema = new Schema(
  {
    order: { type: Number, required: true },
    type: { type: String, enum: ['text', 'voice', 'video'], required: true },
    text: { type: String, default: '' },
    audioUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    durationSec: { type: Number, default: 0 },
    /** Delay after the previous scripted message, in milliseconds. */
    delayMs: { type: Number, default: 2000 },
  },
  { _id: false },
);

const postSchema = new Schema(
  {
    order: { type: Number, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    /** Shown in the grid. For videos this is the still frame. */
    poster: { type: String, required: true },
    /** Full-size media opened in the viewer. Empty falls back to the poster. */
    url: { type: String, default: '' },
    caption: { type: String, default: '' },
    likes: { type: Number, default: 0 },
  },
  { _id: false },
);

const profileSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    gender: { type: String, enum: GENDERS, required: true },
    age: { type: Number, required: true },
    city: { type: String, default: '' },
    bio: { type: String, default: '' },
    photo: { type: String, default: '' },
    interests: { type: [String], default: [] },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    posts: { type: [postSchema], default: [] },
    script: { type: [scriptedMessageSchema], default: [] },
  },
  { timestamps: true },
);

export type ProfileDoc = InferSchemaType<typeof profileSchema>;

export const Profile: Model<ProfileDoc> =
  (models.Profile as Model<ProfileDoc>) || model<ProfileDoc>('Profile', profileSchema);
