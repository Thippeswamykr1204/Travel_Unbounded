"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChatMessage, Itinerary } from "@/types/chat";

const SEED_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi, I'm here to help you plan a trip with Travel Unbounded. Where are you dreaming of going?",
};

const NETWORK_ERROR_MESSAGE =
  "Something went wrong sending that — please try again.";

const SESSION_STORAGE_KEY = "tu_chat_session_id";

function createSessionId(): string {
  return crypto.randomUUID();
}

interface UseChatConversationResult {
  messages: ChatMessage[];
  isTyping: boolean;
  itinerary: Itinerary | null;
  itineraryMessageIndex: number | null;
  error: string | null;
  sessionId: string | null;
  sendMessage: (content: string) => Promise<void>;
  reset: () => void;
}

export function useChatConversation(): UseChatConversationResult {
  const [messages, setMessages] = useState<ChatMessage[]>([SEED_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [itineraryMessageIndex, setItineraryMessageIndex] = useState
      number | null
    >(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // On first mount, resume an existing browser session (sessionStorage) or
  // mint a new one. sessionStorage (not localStorage) so it's scoped to the
  // tab/session rather than persisted indefinitely on shared computers.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);

      if (existing) {
        setSessionId(existing);

        try {
          const response = await fetch(
            `/api/chat/session?sessionId=${encodeURIComponent(existing)}`,
          );
          const result = await response.json().catch(() => null);

          if (cancelled) return;

          const resumedMessages = result?.data?.messages as
            | ChatMessage[]
            | undefined;

          if (
            response.ok &&
            result?.success &&
            result.data &&
            Array.isArray(resumedMessages) &&
            resumedMessages.length > 1
          ) {
            setMessages(resumedMessages);
            const resumedItinerary = (result.data.itinerary ??
              null) as Itinerary | null;
            setItinerary(resumedItinerary);
            if (resumedItinerary) {
              setItineraryMessageIndex(resumedMessages.length - 1);
            }
          }
        } catch (err) {
          console.error("Failed to resume chat session:", err);
        }

        return;
      }

      const created = createSessionId();
      sessionStorage.setItem(SESSION_STORAGE_KEY, created);
      if (!cancelled) setSessionId(created);
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistSession = useCallback(
    (
      currentSessionId: string,
      nextMessages: ChatMessage[],
      nextItinerary: Itinerary | null,
    ) => {
      // Fire-and-forget: never block the UI on this, never surface its
      // errors to the visitor.
      fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          messages: nextMessages,
          ...(nextItinerary ? { itinerary: nextItinerary } : {}),
        }),
      }).catch((err) => {
        console.error("Failed to save chat session:", err);
      });
    },
    [],
  );

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
        const finalMessages: ChatMessage[] = [
          ...nextMessages,
          { role: "assistant", content: data.reply },
        ];

        setMessages(finalMessages);

        let finalItinerary = itinerary;
        if (data.isItineraryReady) {
          finalItinerary = data.itinerary;
          setItinerary(data.itinerary);
          setItineraryMessageIndex(newAssistantIndex);
        }

        if (sessionId) {
          persistSession(sessionId, finalMessages, finalItinerary);
        }
      } catch {
        setError(NETWORK_ERROR_MESSAGE);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, itinerary, sessionId, persistSession],
  );

  const reset = useCallback(() => {
    setMessages([SEED_MESSAGE]);
    setItinerary(null);
    setItineraryMessageIndex(null);
    setError(null);

    // "Start over" starts a fresh server-side session too, not a reuse of
    // the old one.
    const created = createSessionId();
    sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    setSessionId(created);
  }, []);

  return {
    messages,
    isTyping,
    itinerary,
    itineraryMessageIndex,
    error,
    sessionId,
    sendMessage,
    reset,
  };
}