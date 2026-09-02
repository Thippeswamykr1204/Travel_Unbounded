import jwt from "jsonwebtoken";

export const JWT_COOKIE_NAME = "tu_admin_session";
export const REFRESH_COOKIE_NAME = "tu_admin_refresh";

// 7 days, in ms — exported for reuse when setting cookie maxAge / DB expiry.
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type AdminTokenPayload = {
  adminId: string;
  email: string;
};

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