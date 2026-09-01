import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dating-app';

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Next.js reloads modules in development, so the connection is cached globally
// to avoid opening a new pool on every request.
const globalWithMongoose = globalThis as typeof globalThis & {
  __mongooseCache?: MongooseCache;
};

const cache: MongooseCache = globalWithMongoose.__mongooseCache ?? {
  conn: null,
  promise: null,
};

globalWithMongoose.__mongooseCache = cache;

export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: MONGODB_URI.includes('mongodb+srv') ? 20000 : 5000,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}
