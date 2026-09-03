import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer;

function buildRequest(
  method: string,
  url: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }) as unknown as import("next/server").NextRequest;
}

function validItinerary(overrides: Record<string, unknown> = {}) {
  return {
    title: "Slow Days in Goa",
    destination: "Goa",
    duration: 3,
    estimatedBudget: 45000,
    days: [
      {
        day: 1,
        title: "Arrival and the old quarter",
        activities: [
          { time: "Morning", title: "Settle in", description: "Check in and unwind." },
        ],
      },
    ],
    ...overrides,
  };
}

function validEnquiryPayload(overrides: Record<string, unknown> = {}) {
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

let ipCounter = 0;
function nextIp() {
  ipCounter += 1;
  return `10.0.1.${ipCounter}`;
}

describe("/api/chat/session and /api/admin/chat-sessions", () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
  });

  afterEach(async () => {
    const { getChatConversationModel } = await import("@/models/ChatConversation");
    const { getEnquiryModel } = await import("@/models/Enquiry");
    await getChatConversationModel().deleteMany({});
    await getEnquiryModel().deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod?.stop();
  });

  it("creates a new conversation on POST, and upserts (not duplicates) on a second POST with the same sessionId", async () => {
    const { POST } = await import("@/app/api/chat/session/route");
    const { getChatConversationModel } = await import("@/models/ChatConversation");

    const sessionId = "session-upsert-1";

    const first = await POST(
      buildRequest(
        "POST",
        "http://localhost/api/chat/session",
        {
          sessionId,
          messages: [
            { role: "assistant", content: "Hi there!" },
            { role: "user", content: "Plan me a Goa trip" },
          ],
        },
        { "x-forwarded-for": nextIp() },
      ),
    );
    expect(first.status).toBe(200);

    const second = await POST(
      buildRequest(
        "POST",
        "http://localhost/api/chat/session",
        {
          sessionId,
          messages: [
            { role: "assistant", content: "Hi there!" },
            { role: "user", content: "Plan me a Goa trip" },
            { role: "assistant", content: "Here's your itinerary!" },
          ],
          itinerary: validItinerary(),
        },
        { "x-forwarded-for": nextIp() },
      ),
    );
    expect(second.status).toBe(200);

    const ChatConversation = getChatConversationModel();
    const docs = await ChatConversation.find({ sessionId });
    expect(docs).toHaveLength(1);
    expect(docs[0]!.messages).toHaveLength(3);
    expect(docs[0]!.itinerary?.title).toBe("Slow Days in Goa");
  });

  it("GET returns the stored messages/itinerary for an existing session", async () => {
    const { POST, GET } = await import("@/app/api/chat/session/route");

    const sessionId = "session-get-1";

    await POST(
      buildRequest(
        "POST",
        "http://localhost/api/chat/session",
        {
          sessionId,
          messages: [
            { role: "assistant", content: "Hi there!" },
            { role: "user", content: "Plan me a Goa trip" },
          ],
          itinerary: validItinerary(),
        },
        { "x-forwarded-for": nextIp() },
      ),
    );

    const response = await GET(
      buildRequest(
        "GET",
        `http://localhost/api/chat/session?sessionId=${sessionId}`,
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.messages).toHaveLength(2);
    expect(body.data.itinerary.destination).toBe("Goa");
  });

  it("GET with a nonexistent sessionId returns success:true, data:null, not a 404", async () => {
    const { GET } = await import("@/app/api/chat/session/route");

    const response = await GET(
      buildRequest(
        "GET",
        "http://localhost/api/chat/session?sessionId=does-not-exist",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, data: null });
  });

  it("GET /api/admin/chat-sessions only returns conversations that have an itinerary set", async () => {
    const { POST } = await import("@/app/api/chat/session/route");
    const { GET: adminGet } = await import(
      "@/app/api/admin/chat-sessions/route"
    );

    await POST(
      buildRequest(
        "POST",
        "http://localhost/api/chat/session",
        {
          sessionId: "with-itinerary",
          messages: [
            { role: "assistant", content: "Hi there!" },
            { role: "user", content: "Plan me a Goa trip" },
          ],
          itinerary: validItinerary(),
        },
        { "x-forwarded-for": nextIp() },
      ),
    );

    await POST(
      buildRequest(
        "POST",
        "http://localhost/api/chat/session",
        {
          sessionId: "without-itinerary",
          messages: [
            { role: "assistant", content: "Hi there!" },
            { role: "user", content: "Still deciding..." },
          ],
        },
        { "x-forwarded-for": nextIp() },
      ),
    );

    const response = await adminGet(
      buildRequest("GET", "http://localhost/api/admin/chat-sessions"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.sessions).toHaveLength(1);
    expect(body.data.sessions[0].sessionId).toBe("with-itinerary");
  });

  it("creating an enquiry with a valid chatSessionId links the ChatConversation's enquiryId", async () => {
    const { POST: sessionPost } = await import("@/app/api/chat/session/route");
    const { POST: enquiryPost } = await import("@/app/api/enquiry/route");
    const { getChatConversationModel } = await import("@/models/ChatConversation");

    const sessionId = "session-linked";

    await sessionPost(
      buildRequest(
        "POST",
        "http://localhost/api/chat/session",
        {
          sessionId,
          messages: [
            { role: "assistant", content: "Hi there!" },
            { role: "user", content: "Plan me a Goa trip" },
          ],
          itinerary: validItinerary(),
        },
        { "x-forwarded-for": nextIp() },
      ),
    );

    const enquiryResponse = await enquiryPost(
      buildRequest(
        "POST",
        "http://localhost/api/enquiry",
        validEnquiryPayload({ chatSessionId: sessionId }),
        { "x-forwarded-for": nextIp() },
      ),
    );
    const enquiryBody = await enquiryResponse.json();
    expect(enquiryResponse.status).toBe(201);

    const ChatConversation = getChatConversationModel();
    const conversation = await ChatConversation.findOne({ sessionId });
    expect(conversation?.enquiryId).toBe(enquiryBody.id);
  });

  it("creating an enquiry without a chatSessionId doesn't error and doesn't touch any conversation", async () => {
    const { POST: sessionPost } = await import("@/app/api/chat/session/route");
    const { POST: enquiryPost } = await import("@/app/api/enquiry/route");
    const { getChatConversationModel } = await import("@/models/ChatConversation");

    const sessionId = "session-unlinked";

    await sessionPost(
      buildRequest(
        "POST",
        "http://localhost/api/chat/session",
        {
          sessionId,
          messages: [
            { role: "assistant", content: "Hi there!" },
            { role: "user", content: "Plan me a Goa trip" },
          ],
          itinerary: validItinerary(),
        },
        { "x-forwarded-for": nextIp() },
      ),
    );

    const enquiryResponse = await enquiryPost(
      buildRequest(
        "POST",
        "http://localhost/api/enquiry",
        validEnquiryPayload(),
        { "x-forwarded-for": nextIp() },
      ),
    );
    expect(enquiryResponse.status).toBe(201);

    const ChatConversation = getChatConversationModel();
    const conversation = await ChatConversation.findOne({ sessionId });
    expect(conversation?.enquiryId).toBeUndefined();
  });
});