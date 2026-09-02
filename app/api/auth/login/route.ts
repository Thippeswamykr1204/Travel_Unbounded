import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations";
import { connectDB } from "@/lib/mongodb";
import { getAdminUserModel } from "@/models/AdminUser";
import {
  signAdminToken,
  JWT_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
} from "@/lib/auth";
import { generateRefreshToken, hashRefreshToken } from "@/lib/refreshToken";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const loginAttemptBuckets = new Map
  string,
  { count: number; resetAt: number }
>();

function checkLoginRateLimit(identifier: string): { allowed: boolean } {
  const now = Date.now();
  const bucket = loginAttemptBuckets.get(identifier);

  if (!bucket || now > bucket.resetAt) {
    loginAttemptBuckets.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return { allowed: false };
  }

  bucket.count += 1;
  return { allowed: true };
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

const GENERIC_ERROR = "Invalid email or password";
const LOCKOUT_ERROR = "Too many failed attempts — please try again later.";

const ACCOUNT_MAX_ATTEMPTS = 5;
const ACCOUNT_LOCK_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed } = checkLoginRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { success: false, message: "Too many attempts, try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Please check the submitted information.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    await connectDB();
    const AdminUser = getAdminUserModel();
    const admin = await AdminUser.findOne({ email: parsed.data.email });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: GENERIC_ERROR },
        { status: 401 },
      );
    }

    if (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now()) {
      return NextResponse.json(
        { success: false, message: LOCKOUT_ERROR },
        { status: 401 },
      );
    }

    const passwordMatches = await bcrypt.compare(
      parsed.data.password,
      admin.passwordHash,
    );

    if (!passwordMatches) {
      admin.failedLoginAttempts = (admin.failedLoginAttempts ?? 0) + 1;
      if (admin.failedLoginAttempts >= ACCOUNT_MAX_ATTEMPTS) {
        admin.lockedUntil = new Date(Date.now() + ACCOUNT_LOCK_MS);
        admin.failedLoginAttempts = 0;
      }
      await admin.save();

      return NextResponse.json(
        { success: false, message: GENERIC_ERROR },
        { status: 401 },
      );
    }

    admin.failedLoginAttempts = 0;
    admin.lockedUntil = null;

    const token = signAdminToken({
      adminId: admin._id.toString(),
      email: admin.email,
    });

    const refreshToken = generateRefreshToken();
    admin.refreshTokenHash = await hashRefreshToken(refreshToken);
    admin.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await admin.save();

    const response = NextResponse.json({
      success: true,
      data: { email: admin.email, name: admin.name },
    });

    response.cookies.set(JWT_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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