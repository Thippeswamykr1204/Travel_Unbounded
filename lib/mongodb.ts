import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  // Read this lazily, inside the function, rather than at module top
  // level. ES module imports are hoisted and evaluated before other
  // top-level statements in the importing file — so a caller that loads
  // its .env file itself (e.g. standalone scripts run via tsx, which call
  // dotenv's config() before importing this module) would otherwise have
  // this module capture `undefined` for MONGODB_URI, since its top-level
  // code runs before the caller's config() call ever executes.
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}