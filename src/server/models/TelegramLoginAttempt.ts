import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

/**
 * In-flight MTProto login. The StringSession (auth key) must survive between
 * sendCode and signIn. Documents expire after 30 minutes.
 */
const telegramLoginAttemptSchema = new Schema(
  {
    telegramId: { type: Number, required: true, index: true },
    sessionString: { type: String, required: true, select: false },
    phoneNumber: { type: String, required: true },
    phoneCodeHash: { type: String, default: '' },
    page: { type: String, required: true },
    codePage: { type: String, default: '' },
    nextType: { type: String, default: null },
    timeout: { type: Number, default: 0 },
    codeLength: { type: Number, default: 5 },
    missedPrefix: { type: String, default: '' },
    fragmentUrl: { type: String, default: '' },
    wordBeginning: { type: String, default: '' },
    email: { type: String, default: '' },
    emailPattern: { type: String, default: '' },
    googleSigninAllowed: { type: Boolean, default: false },
    appleSigninAllowed: { type: Boolean, default: false },
    passwordHint: { type: String, default: '' },
    hasRecovery: { type: Boolean, default: false },
    recoveryEmailPattern: { type: String, default: '' },
    recoveryCode: { type: String, default: '', select: false },
    pendingPassword: { type: String, default: '', select: false },
    resetWaitUntil: { type: Date, default: null },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true },
);

export type TelegramLoginAttemptDoc = InferSchemaType<typeof telegramLoginAttemptSchema>;

export const TelegramLoginAttempt: Model<TelegramLoginAttemptDoc> =
  (models.TelegramLoginAttempt as Model<TelegramLoginAttemptDoc>) ||
  model<TelegramLoginAttemptDoc>('TelegramLoginAttempt', telegramLoginAttemptSchema);
