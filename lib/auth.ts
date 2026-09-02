import jwt from "jsonwebtoken";

export const JWT_COOKIE_NAME = "tu_admin_session";

export type AdminTokenPayload = {
  adminId: string;
  email: string;
};

export function signAdminToken(payload: AdminTokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.sign(payload, secret, { expiresIn: "8h" });
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