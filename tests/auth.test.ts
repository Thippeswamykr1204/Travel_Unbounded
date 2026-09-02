import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

let mongod: MongoMemoryServer;

function buildRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("lib/auth", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  it("round-trips a payload through signAdminToken/verifyAdminToken", async () => {
    const { signAdminToken, verifyAdminToken } = await import("@/lib/auth");
    const token = signAdminToken({ adminId: "abc123", email: "admin@example.com" });
    const decoded = verifyAdminToken(token);

    expect(decoded).toEqual({ adminId: "abc123", email: "admin@example.com" });
  });

  it("returns null for a tampered/invalid token", async () => {
    const { signAdminToken, verifyAdminToken } = await import("@/lib/auth");
    const token = signAdminToken({ adminId: "abc123", email: "admin@example.com" });
    const tampered = token.slice(0, -2) + "xx";

    expect(verifyAdminToken(tampered)).toBeNull();
    expect(verifyAdminToken("not-a-real-token")).toBeNull();
  });
});

describe("/api/auth/login", () => {
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

  it("returns 401 for a nonexistent email", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(
      buildRequest({ email: "nobody@example.com", password: "whatever" }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("returns 401 for a wrong password", async () => {
    await seedAdmin("admin@example.com", "correct-password");

    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(
      buildRequest({ email: "admin@example.com", password: "wrong-password" }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("returns 200 and sets the session cookie for correct credentials", async () => {
    await seedAdmin("admin@example.com", "correct-password");

    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(
      buildRequest({ email: "admin@example.com", password: "correct-password" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ email: "admin@example.com", name: "Test Admin" });

    const setCookieHeader = response.headers.get("set-cookie");
    expect(setCookieHeader).toBeTruthy();
    expect(setCookieHeader).toContain("tu_admin_session=");
  });
});