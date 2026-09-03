import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getChatConversationModel } from "@/models/ChatConversation";
import { chatSessionIdSchema, chatSessionSaveSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rateLimit";
import type { ChatMessage, Itinerary } from "@/types/chat";

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = chatSessionIdSchema.safeParse(searchParams.get("sessionId"));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "A valid sessionId is required." },
        { status: 400 },
      );
    }

    await connectDB();
    const ChatConversation = getChatConversationModel();
    const conversation = await ChatConversation.findOne({
      sessionId: parsed.data,
    }).lean();

    if (!conversation) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        messages: conversation.messages as ChatMessage[],
        itinerary: (conversation.itinerary as Itinerary | undefined) ?? null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
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

  const parsed = chatSessionSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Please check the submitted information.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { sessionId, messages, itinerary } = parsed.data;

  try {
    await connectDB();
    const ChatConversation = getChatConversationModel();

    // Only overwrite `itinerary` when the client sent one — the hook posts the
    // itinerary once it's generated and keeps sending it on every subsequent
    // save, so an absent itinerary here just means "not generated yet",
    // never "clear the one we already stored".
    const update: Record<string, unknown> = { sessionId, messages };
    if (itinerary) {
      update.itinerary = itinerary;
    }

    await ChatConversation.findOneAndUpdate(
      { sessionId },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}