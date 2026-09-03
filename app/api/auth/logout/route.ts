import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminUserModel } from "@/models/AdminUser";
import {
  JWT_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  verifyAdminToken,
  shouldUseSecureCookies,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  const secure = shouldUseSecureCookies(request);

  response.cookies.set(JWT_COOKIE_NAME, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 0,
  });

  const accessToken = request.cookies.get(JWT_COOKIE_NAME)?.value;
  if (accessToken) {
    const payload = verifyAdminToken(accessToken);
    if (payload) {
      try {
        await connectDB();
        const AdminUser = getAdminUserModel();
        await AdminUser.findByIdAndUpdate(payload.adminId, {
          refreshTokenHash: null,
          refreshTokenExpiresAt: null,
        });
      } catch {
        // Best-effort — cookies are already cleared above.
      }
    }
  }

  return response;
}