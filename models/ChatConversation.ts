import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { ChatRole } from "@/types/chat";

export interface ChatConversationMessage {
  role: ChatRole;
  content: string;
}

export interface ChatConversationItineraryActivity {
  time?: string;
  title: string;
  description?: string;
}

export interface ChatConversationItineraryDay {
  day: number;
  title: string;
  activities: ChatConversationItineraryActivity[];
}

export interface ChatConversationItinerary {
  title: string;
  destination: string;
  duration: number;
  estimatedBudget?: number;
  days: ChatConversationItineraryDay[];
}

export interface ChatConversationDocument extends Document {
  sessionId: string;
  messages: ChatConversationMessage[];
  itinerary?: ChatConversationItinerary;
  enquiryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<ChatConversationMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { _id: false },
);

const itineraryActivitySchema = new Schema<ChatConversationItineraryActivity>(
  {
    time: { type: String, required: false },
    title: { type: String, required: true },
    description: { type: String, required: false },
  },
  { _id: false },
);

const itineraryDaySchema = new Schema<ChatConversationItineraryDay>(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    activities: { type: [itineraryActivitySchema], default: [] },
  },
  { _id: false },
);

const conversationItinerarySchema = new Schema<ChatConversationItinerary>(
  {
    title: { type: String, required: true },
    destination: { type: String, required: true },
    duration: { type: Number, required: true },
    estimatedBudget: { type: Number, required: false },
    days: { type: [itineraryDaySchema], default: [] },
  },
  { _id: false },
);

export const chatConversationSchema = new Schema<ChatConversationDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    messages: { type: [chatMessageSchema], default: [] },
    itinerary: { type: conversationItinerarySchema, required: false },
    enquiryId: { type: String, required: false },
  },
  { timestamps: true },
);

export function getChatConversationModel(): Model<ChatConversationDocument> {
  return (
    (mongoose.models.ChatConversation as Model<ChatConversationDocument>) ||
    mongoose.model<ChatConversationDocument>(
      "ChatConversation",
      chatConversationSchema,
    )
  );
}