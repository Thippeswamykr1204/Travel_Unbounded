export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface TripPreferences {
  destination?: string;
  startDate?: string;
  duration?: number;
  travelers?: number;
  budgetMin?: number;
  budgetMax?: number;
  interests?: string[];
  travelStyle?: string;
}

export interface ItineraryActivity {
  time?: string;
  title: string;
  description?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: ItineraryActivity[];
}

export interface Itinerary {
  title: string;
  destination: string;
  duration: number;
  estimatedBudget?: number;
  days: ItineraryDay[];
}

export type ChatApiResponseData =
  | { isItineraryReady: false; reply: string }
  | { isItineraryReady: true; reply: string; itinerary: Itinerary };