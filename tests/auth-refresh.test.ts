import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

let mongod: MongoMemoryServer;

function buildLoginRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function extractCookieValue(setCookieHeader: string | null, name: string): string {
  if (!setCookieHeader) return "";
  const parts = setCookieHeader.split(/,(?=\s*\w+=)/);
  for (const part of parts) {
    const match = part.match(new RegExp(`${name}=([^;]*)`));
    if (match) return match[1] ?? "";
  }
  return "";
}

function buildRequestWithCookie(url: string, cookieHeader: string) {
  return new Request(url, {
    method: "POST",
    headers: { Cookie: cookieHeader },
  }) as unknown as import("next/server").NextRequest;
}

describe("/api/auth/refresh", () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  afterEach(async () => {
    const { getAdminUserModel } = await import("@/models/AdminUser");
    await getAdminUserModel().deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod?.stop();
  });

  async function seedAdmin(email: string, password: string) {
    const { getAdminUserModel } = await import("@/models/AdminUser");
    const passwordHash = await bcrypt.hash(password, 12);
    await getAdminUserModel().create({
      email,
      passwordHash,
      name: "Test Admin",
      role: "admin",
    });
  }

  async function login(email: string, password: string) {
    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(buildLoginRequest({ email, password }));
    const setCookie = response.headers.get("set-cookie");
    return {
      response,
      accessToken: extractCookieValue(setCookie, "tu_admin_session"),
      refreshToken: extractCookieValue(setCookie, "tu_admin_refresh"),
    };
  }

  it("login returns both an access and refresh cookie", async () => {
    await seedAdmin("admin@example.com", "correct-password");
    const { response, accessToken, refreshToken } = await login(
      "admin@example.com",
      "correct-password",
    );
    expect(response.status).toBe(200);
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
  });

  it("rotates the refresh token and issues a new access token on refresh", async () => {
    await seedAdmin("admin@example.com", "correct-password");
    const { refreshToken } = await login("admin@example.com", "correct-password");

    const { POST: refreshHandler } = await import("@/app/api/auth/refresh/route");
    const response = await refreshHandler(
      buildRequestWithCookie(
        "http://localhost/api/auth/refresh",
        `tu_admin_refresh=${refreshToken}`,
      ),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const setCookie = response.headers.get("set-cookie");
    const newRefreshToken = extractCookieValue(setCookie, "tu_admin_refresh");
    const newAccessToken = extractCookieValue(setCookie, "tu_admin_session");
    expect(newRefreshToken).toBeTruthy();
    expect(newAccessToken).toBeTruthy();
    expect(newRefreshToken).not.toBe(refreshToken);

    const secondAttempt = await refreshHandler(
      buildRequestWithCookie(
        "http://localhost/api/auth/refresh",
        `tu_admin_refresh=${refreshToken}`,
      ),
    );
    expect(secondAttempt.status).toBe(401);
  });

  it("returns 401 when no refresh cookie is present", async () => {
    const { POST: refreshHandler } = await import("@/app/api/auth/refresh/route");
    const response = await refreshHandler(
      buildRequestWithCookie("http://localhost/api/auth/refresh", ""),
    );
    expect(response.status).toBe(401);
  });

  it("returns 401 for an invalid refresh token", async () => {
    const { POST: refreshHandler } = await import("@/app/api/auth/refresh/route");
    const response = await refreshHandler(
      buildRequestWithCookie(
        "http://localhost/api/auth/refresh",
        "tu_admin_refresh=not-a-real-token",
      ),
    );
    expect(response.status).toBe(401);
  });

  it("logout invalidates the stored refresh token server-side", async () => {
    await seedAdmin("admin@example.com", "correct-password");
    const { accessToken, refreshToken } = await login(
      "admin@example.com",
      "correct-password",
    );

    const { POST: logoutHandler } = await import("@/app/api/auth/logout/route");
    await logoutHandler(
      buildRequestWithCookie(
        "http://localhost/api/auth/logout",
        `tu_admin_session=${accessToken}`,
      ),
    );

    const { POST: refreshHandler } = await import("@/app/api/auth/refresh/route");
    const response = await refreshHandler(
      buildRequestWithCookie(
        "http://localhost/api/auth/refresh",
        `tu_admin_refresh=${refreshToken}`,
      ),
    );
    expect(response.status).toBe(401);
  });
});