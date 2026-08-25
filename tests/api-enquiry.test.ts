import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer;

function buildRequest(
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new Request("http://localhost/api/enquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function validPayload(overrides: Record<string, unknown> = {}) {
  const travelDate = new Date();
  travelDate.setDate(travelDate.getDate() + 14);

  return {
    fullName: "Asha Rao",
    countryCode: "+91",
    contactNumber: "9876543210",
    email: "asha@example.com",
    dateOfTravel: travelDate.toISOString(),
    numberOfPeople: 2,
    hotelCategory: "Deluxe",
    numberOfChildren: 0,
    destination: "Goa",
    companyWebsite: "",
    ...overrides,
  };
}

describe("/api/enquiry", () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    process.env.ADMIN_API_KEY = "test-admin-key";
  });

  afterEach(async () => {
    const { getEnquiryModel } = await import("@/models/Enquiry");
    await getEnquiryModel().deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod?.stop();
  });

  it("creates an enquiry with a fully valid payload", async () => {
    const { POST } = await import("@/app/api/enquiry/route");
    const response = await POST(buildRequest(validPayload()));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.id).toBeTruthy();
  });

  it("rejects a payload missing fullName", async () => {
    const { POST } = await import("@/app/api/enquiry/route");
    const response = await POST(
      buildRequest(validPayload({ fullName: "" })),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.fieldErrors).toHaveProperty("fullName");
  });

  it("rejects a past dateOfTravel", async () => {
    const { POST } = await import("@/app/api/enquiry/route");
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const response = await POST(
      buildRequest(validPayload({ dateOfTravel: pastDate.toISOString() })),
    );

    expect(response.status).toBe(400);
  });

  it("rejects numberOfPeople: 0", async () => {
    const { POST } = await import("@/app/api/enquiry/route");
    const response = await POST(
      buildRequest(validPayload({ numberOfPeople: 0 })),
    );

    expect(response.status).toBe(400);
  });

  it("returns a fake success for a tripped honeypot without creating a document", async () => {
    const { POST } = await import("@/app/api/enquiry/route");
    const { getEnquiryModel } = await import("@/models/Enquiry");

    const response = await POST(
      buildRequest(validPayload({ companyWebsite: "https://spam.example" })),
    );
    const body = await response.json();

    expect([200, 201]).toContain(response.status);
    expect(body.success).toBe(true);

    const count = await getEnquiryModel().countDocuments({});
    expect(count).toBe(0);
  });

  it("rejects GET without x-admin-key", async () => {
    const { GET } = await import("@/app/api/enquiry/route");
    const response = await GET(
      buildRequest(null) as unknown as import("next/server").NextRequest,
    );

    expect(response.status).toBe(401);
  });

  it("allows GET with the correct x-admin-key", async () => {
    const { POST, GET } = await import("@/app/api/enquiry/route");
    await POST(buildRequest(validPayload()));

    const request = new Request("http://localhost/api/enquiry", {
      method: "GET",
      headers: { "x-admin-key": "test-admin-key" },
    }) as unknown as import("next/server").NextRequest;

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.enquiries)).toBe(true);
  });
});