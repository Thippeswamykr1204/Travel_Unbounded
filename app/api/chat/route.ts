import { NextRequest, NextResponse } from "next/server";
import { chatRequestSchema, itinerarySchema } from "@/lib/validations";
import { getGeminiModel } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rateLimit";
import type { ChatApiResponseData, ChatMessage } from "@/types/chat";

const GENERIC_REFINE_REPLY =
  "Let me refine that a little more — could you confirm the trip duration and who's travelling?";

const PARSE_FAILURE_REPLY =
  "Sorry, I had trouble putting that together — could you rephrase or tell me a bit more about your trip?";

const GEMINI_ERROR_REPLY =
  "I'm having trouble connecting right now — please try again in a moment, or reach out via the contact form and we'll help you plan directly.";

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    return fenceMatch[1]!.trim();
  }
  return trimmed;
}

function toGeminiRole(role: ChatMessage["role"]): "user" | "model" {
  return role === "assistant" ? "model" : "user";
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "You've reached the limit for now — please try again in a bit.",
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsedRequest = chatRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Please check the submitted information.",
        fieldErrors: parsedRequest.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { messages } = parsedRequest.data;
  const history = messages.slice(0, -1);
  const latest = messages[messages.length - 1]!;

  let rawText: string;
  try {
    const model = getGeminiModel();
    const chat = model.startChat({
      history: history.map((message) => ({
        role: toGeminiRole(message.role),
        parts: [{ text: message.content }],
      })),
    });

    const result = await chat.sendMessage(latest.content);
    rawText = result.response.text();
  } catch (error) {
    console.error("Gemini API call failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({
      success: true,
      data: { isItineraryReady: false, reply: GEMINI_ERROR_REPLY } satisfies ChatApiResponseData,
    });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripCodeFences(rawText));
  } catch (error) {
    console.error("Failed to parse Gemini response as JSON:", error instanceof Error ? error.message : error);
    return NextResponse.json({
      success: true,
      data: { isItineraryReady: false, reply: PARSE_FAILURE_REPLY } satisfies ChatApiResponseData,
    });
  }

  if (
    typeof parsedJson !== "object" ||
    parsedJson === null ||
    !("isItineraryReady" in parsedJson)
  ) {
    return NextResponse.json({
      success: true,
      data: { isItineraryReady: false, reply: PARSE_FAILURE_REPLY } satisfies ChatApiResponseData,
    });
  }

  const candidate = parsedJson as Record<string, unknown>;

  if (candidate.isItineraryReady === true) {
    const itineraryResult = itinerarySchema.safeParse(candidate.itinerary);
    const reply = typeof candidate.reply === "string" && candidate.reply.trim().length > 0
      ? candidate.reply
      : undefined;

    if (!itineraryResult.success) {
      return NextResponse.json({
        success: true,
        data: {
          isItineraryReady: false,
          reply: reply ?? GENERIC_REFINE_REPLY,
        } satisfies ChatApiResponseData,
      });
    }

    if (!reply) {
      return NextResponse.json({
        success: true,
        data: { isItineraryReady: false, reply: GENERIC_REFINE_REPLY } satisfies ChatApiResponseData,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        isItineraryReady: true,
        reply,
        itinerary: itineraryResult.data,
      } satisfies ChatApiResponseData,
    });
  }

  const replyResult =
    typeof candidate.reply === "string" && candidate.reply.trim().length > 0
      ? candidate.reply
      : undefined;

  if (!replyResult) {
    return NextResponse.json({
      success: true,
      data: { isItineraryReady: false, reply: PARSE_FAILURE_REPLY } satisfies ChatApiResponseData,
    });
  }

  return NextResponse.json({
    success: true,
    data: { isItineraryReady: false, reply: replyResult } satisfies ChatApiResponseData,
  });
}