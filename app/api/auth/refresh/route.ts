import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { getAdminUserModel } from "@/models/AdminUser";
import {
  signAdminToken,
  JWT_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
  shouldUseSecureCookies,
} from "@/lib/auth";
import { generateRefreshToken, hashRefreshToken } from "@/lib/refreshToken";

const EXPIRED_MESSAGE = "Session expired, please log in again.";

function clearAuthCookies(response: NextResponse, secure: boolean) {
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
}

export async function POST(request: NextRequest) {
  const secure = shouldUseSecureCookies(request);
  try {
    const presentedToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

    if (!presentedToken) {
      return NextResponse.json(
        { success: false, message: EXPIRED_MESSAGE },
        { status: 401 },
      );
    }

    await connectDB();
    const AdminUser = getAdminUserModel();

    // The refresh token is a raw opaque secret (not a JWT), so there's no
    // "adminId" to decode out of it — we can't look up a document by it
    // directly. At this project's scale (a single admin, or at most a
    // handful), it's acceptable to fetch the small set of candidates with
    // an active, non-expired refresh token and bcrypt.compare the
    // presented token against each stored hash to find the match. This is
    // intentionally simple; a larger deployment would want a lookup-table
    // / token-family scheme, which is out of scope here.
    const candidates = await AdminUser.find({
      refreshTokenHash: { $ne: null },
      refreshTokenExpiresAt: { $gt: new Date() },
    });

    let matchedAdmin: (typeof candidates)[number] | null = null;
    for (const candidate of candidates) {
      if (!candidate.refreshTokenHash) continue;
      const matches = await bcrypt.compare(
        presentedToken,
        candidate.refreshTokenHash,
      );
      if (matches) {
        matchedAdmin = candidate;
        break;
      }
    }

    if (!matchedAdmin) {
      const response = NextResponse.json(
        { success: false, message: EXPIRED_MESSAGE },
        { status: 401 },
      );
      clearAuthCookies(response, secure);
      return response;
    }

    const newRefreshToken = generateRefreshToken();
    matchedAdmin.refreshTokenHash = await hashRefreshToken(newRefreshToken);
    matchedAdmin.refreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_TTL_MS,
    );
    await matchedAdmin.save();

    const newAccessToken = signAdminToken({
      adminId: matchedAdmin._id.toString(),
      email: matchedAdmin.email,
    });

    const response = NextResponse.json({ success: true });

    response.cookies.set(JWT_COOKIE_NAME, newAccessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    response.cookies.set(REFRESH_COOKIE_NAME, newRefreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/api/auth",
      maxAge: Math.floor(REFRESH_TOKEN_TTL_MS / 1000),
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}