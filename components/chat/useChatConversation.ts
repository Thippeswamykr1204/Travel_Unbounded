"use client";

import { useCallback, useState } from "react";
import type { ChatMessage, Itinerary } from "@/types/chat";

const SEED_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi, I'm here to help you plan a trip with Travel Unbounded. Where are you dreaming of going?",
};

const NETWORK_ERROR_MESSAGE =
  "Something went wrong sending that — please try again.";

interface UseChatConversationResult {
  messages: ChatMessage[];
  isTyping: boolean;
  itinerary: Itinerary | null;
  itineraryMessageIndex: number | null;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  reset: () => void;
}

export function useChatConversation(): UseChatConversationResult {
  const [messages, setMessages] = useState<ChatMessage[]>([SEED_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [itineraryMessageIndex, setItineraryMessageIndex] = useState<
    number | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const userMessage: ChatMessage = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMessage];

      setMessages(nextMessages);
      setError(null);
      setIsTyping(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages }),
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          setError(NETWORK_ERROR_MESSAGE);
          return;
        }

        const data = result.data as
          | { isItineraryReady: false; reply: string }
          | { isItineraryReady: true; reply: string; itinerary: Itinerary };

        // Index this new assistant message will occupy once appended.
        const newAssistantIndex = nextMessages.length;

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);

        if (data.isItineraryReady) {
          setItinerary(data.itinerary);
          setItineraryMessageIndex(newAssistantIndex);
        }
      } catch {
        setError(NETWORK_ERROR_MESSAGE);
      } finally {
        setIsTyping(false);
      }
    },
    [messages],
  );

  const reset = useCallback(() => {
    setMessages([SEED_MESSAGE]);
    setItinerary(null);
    setItineraryMessageIndex(null);
    setError(null);
  }, []);

  return {
    messages,
    isTyping,
    itinerary,
    itineraryMessageIndex,
    error,
    sendMessage,
    reset,
  };
}