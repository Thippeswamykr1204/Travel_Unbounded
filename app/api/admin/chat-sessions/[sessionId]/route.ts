import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getChatConversationModel } from "@/models/ChatConversation";
import { chatSessionIdSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const parsed = chatSessionIdSchema.safeParse(sessionId);

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
      return NextResponse.json(
        { success: false, message: "Conversation not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: conversation.sessionId,
        messages: conversation.messages,
        itinerary: conversation.itinerary ?? null,
        enquiryId: conversation.enquiryId ?? null,
        createdAt: new Date(conversation.createdAt).toISOString(),
        updatedAt: new Date(conversation.updatedAt).toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}