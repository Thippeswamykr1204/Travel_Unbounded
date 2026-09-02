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

describe("/api/auth/login account lockout", () => {
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

  it("locks the account after 5 wrong passwords, even with correct password on 6th try", async () => {
    await seedAdmin("admin@example.com", "correct-password");
    const { POST } = await import("@/app/api/auth/login/route");

    for (let i = 0; i < 5; i++) {
      const response = await POST(
        buildRequest({ email: "admin@example.com", password: "wrong-password" }),
      );
      expect(response.status).toBe(401);
    }

    const response = await POST(
      buildRequest({ email: "admin@example.com", password: "correct-password" }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/too many failed attempts/i);
  });

  it("resets failedLoginAttempts to 0 after lock window passes and a successful login occurs", async () => {
    await seedAdmin("admin2@example.com", "correct-password");
    const { getAdminUserModel } = await import("@/models/AdminUser");
    const AdminUser = getAdminUserModel();

    const admin = await AdminUser.findOne({ email: "admin2@example.com" });
    expect(admin).toBeTruthy();

    admin!.failedLoginAttempts = 0;
    admin!.lockedUntil = new Date(Date.now() - 1000);
    await admin!.save();

    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(
      buildRequest({ email: "admin2@example.com", password: "correct-password" }),
    );
    expect(response.status).toBe(200);

    const refreshed = await AdminUser.findOne({ email: "admin2@example.com" });
    expect(refreshed?.failedLoginAttempts).toBe(0);
    expect(refreshed?.lockedUntil).toBeFalsy();
  });
});