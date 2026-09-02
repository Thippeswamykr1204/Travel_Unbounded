import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer;

function buildGetRequest(path: string) {
  return new Request(`http://localhost${path}`, {
    method: "GET",
  }) as unknown as import("next/server").NextRequest;
}

function buildPatchRequest(id: string, body: unknown) {
  return new Request(`http://localhost/api/admin/enquiry/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function seedPayload(overrides: Partial<import("@/models/Enquiry").EnquiryDocument> = {}) {
  return {
    fullName: "Asha Rao",
    countryCode: "+91",
    contactNumber: "9876543210",
    email: "asha@example.com",
    dateOfTravel: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    numberOfPeople: 2,
    hotelCategory: "Deluxe" as const,
    numberOfChildren: 0,
    destination: "Goa",
    status: "new" as const,
    ...overrides,
  };
}

describe("/api/admin/enquiries and /api/admin/enquiry/[id]", () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
  });

  afterEach(async () => {
    const { getEnquiryModel } = await import("@/models/Enquiry");
    await getEnquiryModel().deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod?.stop();
  });

  async function seedEnquiries() {
    const { getEnquiryModel } = await import("@/models/Enquiry");
    const Enquiry = getEnquiryModel();
    await Enquiry.create(
      seedPayload({ fullName: "Asha Rao", email: "asha@example.com", status: "new" }),
    );
    await Enquiry.create(
      seedPayload({ fullName: "Ben Carter", email: "ben@example.com", status: "contacted" }),
    );
    await Enquiry.create(
      seedPayload({
        fullName: "Chitra Menon",
        email: "chitra@example.com",
        status: "converted",
      }),
    );
  }

  it("returns all seeded enquiries with correct total/pagination shape", async () => {
    await seedEnquiries();
    const { GET } = await import("@/app/api/admin/enquiries/route");
    const response = await GET(buildGetRequest("/api/admin/enquiries"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.total).toBe(3);
    expect(body.data.page).toBe(1);
    expect(body.data.totalPages).toBe(1);
    expect(body.data.enquiries).toHaveLength(3);
  });

  it("filters by partial name via q", async () => {
    await seedEnquiries();
    const { GET } = await import("@/app/api/admin/enquiries/route");
    const response = await GET(buildGetRequest("/api/admin/enquiries?q=Ben"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.enquiries).toHaveLength(1);
    expect(body.data.enquiries[0].fullName).toBe("Ben Carter");
  });

  it("filters by status", async () => {
    await seedEnquiries();
    const { GET } = await import("@/app/api/admin/enquiries/route");
    const response = await GET(
      buildGetRequest("/api/admin/enquiries?status=contacted"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.enquiries).toHaveLength(1);
    expect(body.data.enquiries[0].status).toBe("contacted");
  });

  it("returns 400 for an invalid status value", async () => {
    const { GET } = await import("@/app/api/admin/enquiries/route");
    const response = await GET(
      buildGetRequest("/api/admin/enquiries?status=bogus"),
    );

    expect(response.status).toBe(400);
  });

  it("updates status for a valid id", async () => {
    const { getEnquiryModel } = await import("@/models/Enquiry");
    const Enquiry = getEnquiryModel();
    const doc = await Enquiry.create(seedPayload({ status: "new" }));

    const { PATCH } = await import("@/app/api/admin/enquiry/[id]/route");
    const response = await PATCH(buildPatchRequest(doc._id.toString(), { status: "contacted" }), {
      params: Promise.resolve({ id: doc._id.toString() }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("contacted");
  });

  it("returns 400 for an invalid ObjectId format", async () => {
    const { PATCH } = await import("@/app/api/admin/enquiry/[id]/route");
    const response = await PATCH(buildPatchRequest("not-an-id", { status: "contacted" }), {
      params: Promise.resolve({ id: "not-an-id" }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 404 for a well-formed but nonexistent id", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const { PATCH } = await import("@/app/api/admin/enquiry/[id]/route");
    const response = await PATCH(buildPatchRequest(missingId, { status: "contacted" }), {
      params: Promise.resolve({ id: missingId }),
    });

    expect(response.status).toBe(404);
  });
});