import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const messageSchema = new Schema(
  {
    telegramId: { type: Number, required: true, index: true },
    profileSlug: { type: String, required: true, index: true },
    /** 'profile' for scripted incoming messages, 'user' for replies. */
    sender: { type: String, enum: ['profile', 'user'], required: true },
    type: { type: String, enum: ['text', 'voice', 'video'], required: true },
    text: { type: String, default: '' },
    audioUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    durationSec: { type: Number, default: 0 },
    /** Scripted messages appear only once this timestamp has passed. */
    deliverAt: { type: Date, required: true, index: true },
    /**
     * When the partner starts typing or recording this message. Until then the
     * chat stays idle so the gap between bubbles feels like a real pause.
     */
    composeAt: { type: Date, default: null },
  },
  { timestamps: true },
);

messageSchema.index({ telegramId: 1, deliverAt: 1 });

export type MessageDoc = InferSchemaType<typeof messageSchema>;

export const Message: Model<MessageDoc> =
  (models.Message as Model<MessageDoc>) || model<MessageDoc>('Message', messageSchema);
