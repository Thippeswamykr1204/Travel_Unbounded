import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer;

const ACCESS_COOKIE = "tu_admin_session";

function cookieHeaderFor(token: string) {
  return `${ACCESS_COOKIE}=${token}`;
}

function buildPatchRequest(url: string, body: unknown, cookie: string) {
  return new Request(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function buildPostRequest(url: string, body: unknown, cookie: string) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function buildDeleteRequest(url: string, cookie: string) {
  return new Request(url, {
    method: "DELETE",
    headers: { Cookie: cookie },
  }) as unknown as import("next/server").NextRequest;
}

describe("admin audit log", () => {
  let adminToken: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    process.env.JWT_SECRET = "test-jwt-secret";

    const { signAdminToken } = await import("@/lib/auth");
    adminToken = signAdminToken({ adminId: "admin-1", email: "admin@example.com" });
  });

  afterEach(async () => {
    const { getEnquiryModel } = await import("@/models/Enquiry");
    const { getDestinationModel } = await import("@/models/Destination");
    const { getAdminAuditLogModel } = await import("@/models/AdminAuditLog");
    await getEnquiryModel().deleteMany({});
    await getDestinationModel().deleteMany({});
    await getAdminAuditLogModel().deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod?.stop();
  });

  it("logs an entry when an enquiry status is updated", async () => {
    const { getEnquiryModel } = await import("@/models/Enquiry");
    const enquiry = await getEnquiryModel().create({
      fullName: "Jane Doe",
      countryCode: "+91",
      contactNumber: "9999999999",
      email: "jane@example.com",
      dateOfTravel: new Date(),
      numberOfPeople: 2,
      hotelCategory: "Standard",
      status: "new",
    });

    const { PATCH } = await import("@/app/api/admin/enquiry/[id]/route");
    const response = await PATCH(
      buildPatchRequest(
        `http://localhost/api/admin/enquiry/${enquiry._id}`,
        { status: "contacted" },
        cookieHeaderFor(adminToken),
      ),
      { params: Promise.resolve({ id: String(enquiry._id) }) },
    );
    expect(response.status).toBe(200);

    const { getAdminAuditLogModel } = await import("@/models/AdminAuditLog");
    const logs = await getAdminAuditLogModel().find({});
    expect(logs).toHaveLength(1);
    expect(logs[0]!.action).toBe("enquiry.status_updated");
    expect(logs[0]!.summary).toContain("contacted");
    expect(logs[0]!.adminEmail).toBe("admin@example.com");
  });

  function validDestinationPayload(overrides: Record<string, unknown> = {}) {
    return {
      name: "Kerala Backwaters",
      country: "India",
      category: "india",
      mood: "Relaxed",
      image: "https://example.com/images/kerala.jpg",
      description: "Drift past coconut groves on a converted rice barge.",
      price: 42000,
      duration: "5 Nights / 6 Days",
      active: true,
      ...overrides,
    };
  }

  it("logs entries for destination create, update, and delete", async () => {
    const { POST } = await import("@/app/api/admin/destinations/route");
    const createResponse = await POST(
      buildPostRequest(
        "http://localhost/api/admin/destinations",
        validDestinationPayload(),
        cookieHeaderFor(adminToken),
      ),
    );
    expect(createResponse.status).toBe(201);
    const createBody = await createResponse.json();
    const destinationId = createBody.data._id;

    const { PATCH, DELETE } = await import(
      "@/app/api/admin/destinations/[id]/route"
    );
    const updateResponse = await PATCH(
      buildPatchRequest(
        `http://localhost/api/admin/destinations/${destinationId}`,
        { name: "Kerala Backwaters Deluxe" },
        cookieHeaderFor(adminToken),
      ),
      { params: Promise.resolve({ id: destinationId }) },
    );
    expect(updateResponse.status).toBe(200);

    const deleteResponse = await DELETE(
      buildDeleteRequest(
        `http://localhost/api/admin/destinations/${destinationId}`,
        cookieHeaderFor(adminToken),
      ),
      { params: Promise.resolve({ id: destinationId }) },
    );
    expect(deleteResponse.status).toBe(200);

    const { getAdminAuditLogModel } = await import("@/models/AdminAuditLog");
    const logs = await getAdminAuditLogModel().find({}).sort({ createdAt: 1 });
    expect(logs).toHaveLength(3);
    expect(logs[0]!.action).toBe("destination.created");
    expect(logs[1]!.action).toBe("destination.updated");
    expect(logs[2]!.action).toBe("destination.deleted");
    expect(logs[2]!.summary).toContain("Kerala Backwaters Deluxe");
  });

  it("GET /api/admin/audit-log returns entries sorted newest-first", async () => {
    const { recordAuditLog } = await import("@/lib/auditLog");
    await recordAuditLog({
      adminId: "admin-1",
      adminEmail: "admin@example.com",
      action: "destination.created",
      targetId: "t1",
      summary: "first",
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await recordAuditLog({
      adminId: "admin-1",
      adminEmail: "admin@example.com",
      action: "destination.created",
      targetId: "t2",
      summary: "second",
    });

    const { GET } = await import("@/app/api/admin/audit-log/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].summary).toBe("second");
    expect(body.data[1].summary).toBe("first");
  });

  it("does not throw when the underlying audit log write fails", async () => {
    const { getAdminAuditLogModel } = await import("@/models/AdminAuditLog");
    const createSpy = vi
      .spyOn(getAdminAuditLogModel(), "create")
      .mockImplementationOnce(() => {
        throw new Error("simulated write failure");
      });

    const { recordAuditLog } = await import("@/lib/auditLog");
    await expect(
      recordAuditLog({
        adminId: "admin-1",
        adminEmail: "admin@example.com",
        action: "destination.created",
        targetId: "t3",
        summary: "should not throw",
      }),
    ).resolves.toBeUndefined();

    createSpy.mockRestore();
  });
});