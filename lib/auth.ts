import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

export const JWT_COOKIE_NAME = "tu_admin_session";
export const REFRESH_COOKIE_NAME = "tu_admin_refresh";

// 7 days, in ms — exported for reuse when setting cookie maxAge / DB expiry.
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type AdminTokenPayload = {
  adminId: string;
  email: string;
};

// Whether auth cookies should carry the `Secure` attribute.
//
// Browsers silently drop `Secure` cookies when the response isn't served
// over HTTPS. Gating this purely on `NODE_ENV === "production"` breaks
// local testing of a production build (`next build && next start`) on
// plain `http://localhost:3000`, because Next sets NODE_ENV=production
// automatically — the login request "succeeds" but the cookie is never
// actually stored, so the very next navigation looks unauthenticated and
// bounces back to /admin/login.
//
// Instead, key off the protocol of the incoming request (falling back to
// x-forwarded-proto, which is what most hosts/proxies — including Vercel
// — set), so real HTTPS deployments still get Secure cookies while local
// http testing (dev or prod-mode) keeps working.
export function shouldUseSecureCookies(request: NextRequest): boolean {
  if (request.nextUrl.protocol === "https:") {
    return true;
  }
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return forwardedProto?.split(",")[0]?.trim() === "https";
}

export function signAdminToken(payload: AdminTokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  // Short-lived access token — refresh-token rotation (see lib/refreshToken.ts
  // and app/api/auth/refresh) keeps the session alive without a long-lived JWT.
  return jwt.sign(payload, secret, { expiresIn: "15m" });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }
  try {
    const decoded = jwt.verify(token, secret);
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      typeof (decoded as Record<string, unknown>).adminId === "string" &&
      typeof (decoded as Record<string, unknown>).email === "string"
    ) {
      return {
        adminId: (decoded as Record<string, unknown>).adminId as string,
        email: (decoded as Record<string, unknown>).email as string,
      };
    }
    return null;
  } catch {
    return null;
  }
}