import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

/**
 * Binary media uploaded by users. Kept in its own collection so a single user
 * document never approaches the BSON size limit, and served through
 * `/api/uploads/[id]`.
 */
const uploadSchema = new Schema(
  {
    telegramId: { type: Number, required: true, index: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true },
);

export type UploadDoc = InferSchemaType<typeof uploadSchema>;

export const Upload: Model<UploadDoc> =
  (models.Upload as Model<UploadDoc>) || model<UploadDoc>('Upload', uploadSchema);
