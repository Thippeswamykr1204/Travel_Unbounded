import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer;

function buildPostRequest(body: unknown) {
  return new Request("http://localhost/api/admin/destinations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function buildPatchRequest(id: string, body: unknown) {
  return new Request(`http://localhost/api/admin/destinations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function buildDeleteRequest(id: string) {
  return new Request(`http://localhost/api/admin/destinations/${id}`, {
    method: "DELETE",
  }) as unknown as import("next/server").NextRequest;
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "Kerala",
    country: "India",
    category: "india",
    mood: "Backwaters",
    image: "https://example.com/images/kerala.jpg",
    description: "Drift past coconut groves on a converted rice barge.",
    price: 42000,
    duration: "5 Nights / 6 Days",
    active: true,
    ...overrides,
  };
}

describe("/api/destinations and /api/admin/destinations", () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
  });

  afterEach(async () => {
    const { getDestinationModel } = await import("@/models/Destination");
    await getDestinationModel().deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod?.stop();
  });

  async function seedDestinations() {
    const { getDestinationModel } = await import("@/models/Destination");
    const Destination = getDestinationModel();
    await Destination.create([
      {
        slug: "kerala",
        name: "Kerala",
        country: "India",
        category: "india",
        mood: "Backwaters",
        image: "https://example.com/kerala.jpg",
        description: "desc",
        price: 42000,
        currency: "INR",
        duration: "5 Nights / 6 Days",
        active: true,
        featured: false,
      },
      {
        slug: "goa",
        name: "Goa",
        country: "India",
        category: "india",
        mood: "Laterite",
        image: "https://example.com/goa.jpg",
        description: "desc",
        price: 28000,
        currency: "INR",
        duration: "4 Nights / 5 Days",
        active: false,
        featured: false,
      },
    ]);
  }

  it("GET /api/destinations returns only active destinations", async () => {
    await seedDestinations();
    const { GET } = await import("@/app/api/destinations/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("kerala");
  });

  it("GET /api/admin/destinations returns all destinations including inactive", async () => {
    await seedDestinations();
    const { GET } = await import("@/app/api/admin/destinations/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(2);
  });

  it("POST /api/admin/destinations creates a destination with an auto-generated unique slug", async () => {
    const { POST } = await import("@/app/api/admin/destinations/route");
    const response = await POST(buildPostRequest(validPayload()));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("kerala");
  });

  it("de-duplicates the slug on name collision", async () => {
    const { POST } = await import("@/app/api/admin/destinations/route");
    await POST(buildPostRequest(validPayload()));
    const response = await POST(buildPostRequest(validPayload()));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.id).not.toBe("kerala");
    expect(body.data.id).toMatch(/^kerala-\d+$/);
  });

  it("rejects invalid data (negative price, bad image URL)", async () => {
    const { POST } = await import("@/app/api/admin/destinations/route");
    const response = await POST(
      buildPostRequest(validPayload({ price: -10, image: "not-a-url" })),
    );

    expect(response.status).toBe(400);
  });

  it("PATCH updates fields and ignores an attempted slug change", async () => {
    const { getDestinationModel } = await import("@/models/Destination");
    const Destination = getDestinationModel();
    const doc = await Destination.create({
      slug: "kerala",
      name: "Kerala",
      country: "India",
      category: "india",
      mood: "Backwaters",
      image: "https://example.com/kerala.jpg",
      description: "desc",
      price: 42000,
      currency: "INR",
      duration: "5 Nights / 6 Days",
      active: true,
      featured: false,
    });

    const { PATCH } = await import("@/app/api/admin/destinations/[id]/route");
    const response = await PATCH(
      buildPatchRequest(doc._id.toString(), { price: 50000, slug: "hacked" }),
      { params: Promise.resolve({ id: doc._id.toString() }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.price).toBe(50000);
    expect(body.data.id).toBe("kerala");
  });

  it("PATCH returns 400 for invalid ObjectId and 404 for nonexistent id", async () => {
    const { PATCH } = await import("@/app/api/admin/destinations/[id]/route");

    const badIdResponse = await PATCH(buildPatchRequest("not-an-id", { price: 1000 }), {
      params: Promise.resolve({ id: "not-an-id" }),
    });
    expect(badIdResponse.status).toBe(400);

    const missingId = new mongoose.Types.ObjectId().toString();
    const missingResponse = await PATCH(buildPatchRequest(missingId, { price: 1000 }), {
      params: Promise.resolve({ id: missingId }),
    });
    expect(missingResponse.status).toBe(404);
  });

  it("DELETE removes the destination; DELETE on nonexistent id returns 404", async () => {
    const { getDestinationModel } = await import("@/models/Destination");
    const Destination = getDestinationModel();
    const doc = await Destination.create({
      slug: "kerala",
      name: "Kerala",
      country: "India",
      category: "india",
      mood: "Backwaters",
      image: "https://example.com/kerala.jpg",
      description: "desc",
      price: 42000,
      currency: "INR",
      duration: "5 Nights / 6 Days",
      active: true,
      featured: false,
    });

    const { DELETE } = await import("@/app/api/admin/destinations/[id]/route");
    const response = await DELETE(buildDeleteRequest(doc._id.toString()), {
      params: Promise.resolve({ id: doc._id.toString() }),
    });
    expect(response.status).toBe(200);

    const count = await Destination.countDocuments({});
    expect(count).toBe(0);

    const missingResponse = await DELETE(buildDeleteRequest(doc._id.toString()), {
      params: Promise.resolve({ id: doc._id.toString() }),
    });
    expect(missingResponse.status).toBe(404);
  });
});