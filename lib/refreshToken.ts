import crypto from "crypto";
import bcrypt from "bcryptjs";

// IMPORTANT: this file is Node-only (uses the built-in `crypto` module and
// bcryptjs). It must NEVER be imported by middleware.ts or anything else
// that runs on the Edge runtime — that's exactly why these two functions
// live here instead of in lib/auth.ts, which middleware.ts does import.

/**
 * Generates a cryptographically random opaque refresh token. This is NOT a
 * JWT — it is a random secret whose bcrypt hash is stored on the admin
 * document, and is looked up/compared server-side on refresh.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hashes a refresh token for storage. 10 rounds is sufficient here since
 * the input is already a high-entropy random token (unlike a user-chosen
 * password), so a slower cost factor isn't needed.
 */
export async function hashRefreshToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}