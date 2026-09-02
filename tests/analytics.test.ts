import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer;

function buildGetRequest(path: string) {
  return new Request(`http://localhost${path}`, {
    method: "GET",
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

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

describe("analytics summary", () => {
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

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 10);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 10);

    const docs = await Enquiry.create([
      seedPayload({
        fullName: "Asha Rao",
        email: "asha@example.com",
        status: "new",
        destination: "Goa",
      }),
      seedPayload({
        fullName: "Ben Carter",
        email: "ben@example.com",
        status: "contacted",
        destination: "Goa",
      }),
      seedPayload({
        fullName: "Chitra Menon",
        email: "chitra@example.com",
        status: "converted",
        destination: "Kerala",
      }),
      seedPayload({
        fullName: "Dev Patel",
        email: "dev@example.com",
        status: "closed",
        destination: undefined,
      }),
    ]);

    // Manually backdate createdAt for the first two docs into last month.
    await Enquiry.updateOne({ _id: docs[0]._id }, { $set: { createdAt: lastMonth } });
    await Enquiry.updateOne({ _id: docs[1]._id }, { $set: { createdAt: lastMonth } });
    await Enquiry.updateOne({ _id: docs[2]._id }, { $set: { createdAt: thisMonth } });
    await Enquiry.updateOne({ _id: docs[3]._id }, { $set: { createdAt: thisMonth } });

    return { thisMonth, lastMonth };
  }

  it("returns monthlyVolume with correct counts including zero-count months", async () => {
    const { thisMonth, lastMonth } = await seedEnquiries();
    const { getAnalyticsSummary } = await import("@/lib/analytics");
    const summary = await getAnalyticsSummary(6);

    expect(summary.monthlyVolume).toHaveLength(6);

    const lastMonthEntry = summary.monthlyVolume.find((m) => m.month === monthKey(lastMonth));
    const thisMonthEntry = summary.monthlyVolume.find((m) => m.month === monthKey(thisMonth));

    expect(lastMonthEntry?.count).toBe(2);
    expect(thisMonthEntry?.count).toBe(2);

    const zeroMonths = summary.monthlyVolume.filter((m) => m.count === 0);
    expect(zeroMonths.length).toBeGreaterThan(0);
  });

  it("includes all 4 statuses in statusBreakdown even with zero counts", async () => {
    await seedEnquiries();
    const { getAnalyticsSummary } = await import("@/lib/analytics");
    const summary = await getAnalyticsSummary(6);

    expect(summary.statusBreakdown).toHaveLength(4);
    const statuses = summary.statusBreakdown.map((s) => s.status).sort();
    expect(statuses).toEqual(["closed", "contacted", "converted", "new"]);

    const newEntry = summary.statusBreakdown.find((s) => s.status === "new");
    expect(newEntry?.count).toBe(1);
  });

  it("excludes docs with no destination and ranks topDestinations by count", async () => {
    await seedEnquiries();
    const { getAnalyticsSummary } = await import("@/lib/analytics");
    const summary = await getAnalyticsSummary(6);

    expect(summary.topDestinations[0]).toEqual({ destination: "Goa", count: 2 });
    const total = summary.topDestinations.reduce((sum, d) => sum + d.count, 0);
    expect(total).toBe(3);
  });

  it("computes conversionRate correctly", async () => {
    await seedEnquiries();
    const { getAnalyticsSummary } = await import("@/lib/analytics");
    const summary = await getAnalyticsSummary(6);

    expect(summary.totalEnquiries).toBe(4);
    expect(summary.convertedCount).toBe(1);
    expect(summary.conversionRate).toBe(25);
  });

  it("returns 0 conversionRate (not NaN/Infinity) for an empty collection", async () => {
    const { getAnalyticsSummary } = await import("@/lib/analytics");
    const summary = await getAnalyticsSummary(6);

    expect(summary.totalEnquiries).toBe(0);
    expect(summary.convertedCount).toBe(0);
    expect(summary.conversionRate).toBe(0);
    expect(Number.isFinite(summary.conversionRate)).toBe(true);
  });

  it("GET returns 400 for an invalid months query param", async () => {
    const { GET } = await import("@/app/api/admin/analytics/summary/route");

    const zeroResponse = await GET(buildGetRequest("/api/admin/analytics/summary?months=0"));
    expect(zeroResponse.status).toBe(400);

    const tooLargeResponse = await GET(
      buildGetRequest("/api/admin/analytics/summary?months=100"),
    );
    expect(tooLargeResponse.status).toBe(400);
  });

  it("GET returns 200 with the expected data shape for a valid months param", async () => {
    await seedEnquiries();
    const { GET } = await import("@/app/api/admin/analytics/summary/route");
    const response = await GET(buildGetRequest("/api/admin/analytics/summary?months=6"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.monthlyVolume).toHaveLength(6);
    expect(body.data.statusBreakdown).toHaveLength(4);
    expect(body.data.totalEnquiries).toBe(4);
  });
});