"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { useChatConversation } from "@/components/chat/useChatConversation";
import ItineraryDisplay from "@/components/chat/ItineraryDisplay";
import TypingIndicator from "@/components/chat/TypingIndicator";
import QuickReplyChips from "@/components/chat/QuickReplyChips";

interface ChatWindowProps {
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function ChatWindow({ onClose }: ChatWindowProps) {
  const {
    messages,
    isTyping,
    itinerary,
    itineraryMessageIndex,
    error,
    sessionId,
    sendMessage,
    reset,
  } = useChatConversation();
  const [inputValue, setInputValue] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [messages.length, isTyping]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;
    setInputValue("");
    await sendMessage(trimmed);
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Travel Unbounded chat"
      className="fixed inset-0 z-[70] flex flex-col bg-paper shadow-xl sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[600px] sm:w-[380px] sm:rounded-lg sm:border sm:border-ink/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
        <span className="font-display text-base font-semibold text-ink">
          Travel Unbounded
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="font-sans text-xs font-medium text-ink/60 underline-offset-4 hover:text-ink hover:underline"
          >
            Start over
          </button>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close chat"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-sand/60"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </svg>
          </button>
        </div>
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((message, index) => {
          const isUser = message.role === "user";
          const showItineraryHere =
            itinerary !== null && itineraryMessageIndex === index;

          return (
            <div
              key={index}
              className={cn("flex flex-col", isUser ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 font-sans text-sm leading-relaxed",
                  isUser
                    ? "rounded-br-sm bg-terra text-paper"
                    : "rounded-bl-sm bg-sand/60 text-ink",
                )}
              >
                {message.content}
              </div>

              {showItineraryHere && (
                <ItineraryDisplay
                  itinerary={itinerary}
                  sessionId={sessionId ?? undefined}
                />
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex flex-col items-start">
            <TypingIndicator />
          </div>
        )}
      </div>

      {messages.length === 1 && (
        <QuickReplyChips onSelect={sendMessage} disabled={isTyping} />
      )}

      {error && (
        <div
          role="alert"
          className="mx-4 mb-2 rounded-md border border-terra/30 bg-terra/10 px-3 py-2 font-sans text-xs text-ink"
        >
          {error}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-ink/10 px-4 py-3"
      >
        <label htmlFor="chat-message-input" className="sr-only">
          Type a message
        </label>
        <input
          id="chat-message-input"
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          disabled={isTyping}
          placeholder="Type a message…"
          autoComplete="off"
          className="w-full flex-1 appearance-none rounded-full border border-ink/15 bg-paper px-4 py-2.5 font-sans text-sm text-ink placeholder:text-ink/40 outline-none focus:border-terra disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isTyping || inputValue.trim().length === 0}
          aria-label="Send message"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terra text-paper transition-colors hover:bg-terra/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}