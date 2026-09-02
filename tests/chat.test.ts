import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sendMessageMock = vi.fn();
const startChatMock = vi.fn(() => ({ sendMessage: sendMessageMock }));
const getGenerativeModelMock = vi.fn(() => ({ startChat: startChatMock }));

vi.mock("@google/generative-ai", () => {
  class MockGoogleGenerativeAI {
    getGenerativeModel = getGenerativeModelMock;
  }
  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI,
  };
});

let ipCounter = 0;

function buildPostRequest(body: unknown, ip?: string) {
  ipCounter += 1;
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip ?? `10.0.0.${ipCounter}`,
    },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function mockGeminiText(text: string) {
  sendMessageMock.mockResolvedValueOnce({
    response: { text: () => text },
  });
}

const validItinerary = {
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
};

describe("POST /api/chat", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    sendMessageMock.mockReset();
    startChatMock.mockClear();
    getGenerativeModelMock.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 200 with isItineraryReady: false and a reply for a valid conversation", async () => {
    mockGeminiText(
      JSON.stringify({ isItineraryReady: false, reply: "Where are you thinking of going?" }),
    );

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      buildPostRequest({ messages: [{ role: "user", content: "Help me plan a trip" }] }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isItineraryReady).toBe(false);
    expect(typeof body.data.reply).toBe("string");
    expect(body.data.reply.length).toBeGreaterThan(0);
  });

  it("returns a valid itinerary when the model returns a fully valid ready JSON string", async () => {
    mockGeminiText(
      JSON.stringify({
        isItineraryReady: true,
        reply: "Here's a plan for your Goa trip!",
        itinerary: validItinerary,
      }),
    );

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      buildPostRequest({
        messages: [
          { role: "user", content: "3 days in Goa, 2 travelers, love beaches and food" },
        ],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.isItineraryReady).toBe(true);
    expect(body.data.itinerary).toEqual(validItinerary);
  });

  it("falls back gracefully when the model returns malformed JSON (plain prose)", async () => {
    mockGeminiText("Sure! Let's plan your trip together, sounds exciting.");

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      buildPostRequest({ messages: [{ role: "user", content: "Help me plan a trip" }] }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.isItineraryReady).toBe(false);
    expect(typeof body.data.reply).toBe("string");
  });

  it("falls back gracefully when the model wraps JSON in markdown code fences", async () => {
    const fenced = "```json\n" + JSON.stringify({ isItineraryReady: false, reply: "Got it!" }) + "\n```";
    mockGeminiText(fenced);

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      buildPostRequest({ messages: [{ role: "user", content: "Help me plan a trip" }] }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.isItineraryReady).toBe(false);
    expect(body.data.reply).toBe("Got it!");
  });

  it("falls back gracefully when a ready itinerary fails schema validation", async () => {
    mockGeminiText(
      JSON.stringify({
        isItineraryReady: true,
        reply: "Here's your plan!",
        itinerary: { title: "Broken", destination: "Goa", duration: 3 }, // missing days
      }),
    );

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      buildPostRequest({ messages: [{ role: "user", content: "Plan my trip" }] }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.isItineraryReady).toBe(false);
    expect(typeof body.data.reply).toBe("string");
    expect(body.data.itinerary).toBeUndefined();
  });

  it("returns 400 when the request body fails chatRequestSchema", async () => {
    const { POST } = await import("@/app/api/chat/route");

    const emptyMessagesResponse = await POST(buildPostRequest({ messages: [] }));
    expect(emptyMessagesResponse.status).toBe(400);

    const tooLongMessageResponse = await POST(
      buildPostRequest({ messages: [{ role: "user", content: "a".repeat(2001) }] }),
    );
    expect(tooLongMessageResponse.status).toBe(400);

    const tooManyMessages = Array.from({ length: 41 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: "hi",
    }));
    const tooManyMessagesResponse = await POST(buildPostRequest({ messages: tooManyMessages }));
    expect(tooManyMessagesResponse.status).toBe(400);
  });

  it("returns 429 after exceeding the rate limit", async () => {
    mockGeminiText(JSON.stringify({ isItineraryReady: false, reply: "Hi there!" }));

    const { POST } = await import("@/app/api/chat/route");

    let lastResponse;
    for (let i = 0; i < 11; i += 1) {
      mockGeminiText(JSON.stringify({ isItineraryReady: false, reply: "Hi there!" }));
      lastResponse = await POST(
        buildPostRequest(
          { messages: [{ role: "user", content: "Help me plan a trip" }] },
          "10.20.30.40",
        ),
      );
    }

    expect(lastResponse!.status).toBe(429);
    const body = await lastResponse!.json();
    expect(body.success).toBe(false);
  });

  it("returns 200 with a friendly fallback when the Gemini client throws", async () => {
    sendMessageMock.mockRejectedValueOnce(new Error("quota exceeded"));

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      buildPostRequest({ messages: [{ role: "user", content: "Help me plan a trip" }] }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isItineraryReady).toBe(false);
    expect(typeof body.data.reply).toBe("string");
  });
});