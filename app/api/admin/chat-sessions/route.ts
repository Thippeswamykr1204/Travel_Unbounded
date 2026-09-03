import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getChatConversationModel } from "@/models/ChatConversation";
import { adminChatSessionQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = adminChatSessionQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid query parameters.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { page, limit } = parsed.data;

    await connectDB();
    const ChatConversation = getChatConversationModel();

    // Only conversations that produced an itinerary are "leads" — the rest
    // are visitors who left mid-conversation and aren't useful here.
    const filter = { itinerary: { $ne: null } };

    const total = await ChatConversation.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const docs = await ChatConversation.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const sessions = docs.map((doc) => ({
      sessionId: doc.sessionId,
      itinerary: doc.itinerary
        ? {
            title: doc.itinerary.title,
            destination: doc.itinerary.destination,
            duration: doc.itinerary.duration,
          }
        : null,
      messageCount: doc.messages?.length ?? 0,
      hasEnquiry: Boolean(doc.enquiryId),
      createdAt: new Date(doc.createdAt).toISOString(),
      updatedAt: new Date(doc.updatedAt).toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: { sessions, total, page, totalPages },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}