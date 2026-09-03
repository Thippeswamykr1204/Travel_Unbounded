"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { cn } from "@/lib/utils";
import type { ChatMessage, Itinerary } from "@/types/chat";

const LIMIT = 10;

type ChatSessionSummary = {
  sessionId: string;
  itinerary: { title: string; destination: string; duration: number } | null;
  messageCount: number;
  hasEnquiry: boolean;
  createdAt: string;
  updatedAt: string;
};

type ChatSessionDetail = {
  sessionId: string;
  messages: ChatMessage[];
  itinerary: Itinerary | null;
  enquiryId: string | null;
  createdAt: string;
  updatedAt: string;
};

type FetchState = {
  sessions: ChatSessionSummary[];
  total: number;
  page: number;
  totalPages: number;
};

const EMPTY_STATE: FetchState = { sessions: [], total: 0, page: 1, totalPages: 1 };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AiLeadsPage() {
  const [page, setPage] = useState(1);
  const [state, setState] = useState<FetchState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ChatSessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchIdRef = useRef(0);

  const loadSessions = useCallback(async () => {
    const requestId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(LIMIT));

    try {
      const response = await fetch(`/api/admin/chat-sessions?${params.toString()}`, {
        credentials: "include",
      });
      const body = await response.json().catch(() => null);

      if (requestId !== fetchIdRef.current) return;

      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Failed to load AI leads.");
        setState(EMPTY_STATE);
        return;
      }

      setState(body.data);
    } catch {
      if (requestId !== fetchIdRef.current) return;
      setError("Failed to load AI leads.");
      setState(EMPTY_STATE);
    } finally {
      if (requestId === fetchIdRef.current) setLoading(false);
    }
  }, [page]);

  /* eslint-disable react-hooks/set-state-in-effect -- data fetch on page change, not a render-state sync */
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const rangeLabel = useMemo(() => {
    if (state.total === 0) return "Showing 0 of 0";
    const start = (state.page - 1) * LIMIT + 1;
    const end = Math.min(state.page * LIMIT, state.total);
    return `Showing ${start}–${end} of ${state.total}`;
  }, [state]);

  const handleToggle = async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      setDetail(null);
      setDetailError(null);
      return;
    }

    setExpandedId(sessionId);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const response = await fetch(
        `/api/admin/chat-sessions/${encodeURIComponent(sessionId)}`,
        { credentials: "include" },
      );
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        setDetailError(body?.message ?? "Failed to load conversation.");
        return;
      }

      setDetail(body.data);
    } catch {
      setDetailError("Failed to load conversation.");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <AdminShell activeNav="ai-leads">
      <h1 className="font-display text-3xl text-ink">AI Leads</h1>
      <p className="mt-2 font-sans text-sm text-ink/70">
        Conversations where the chatbot produced a full itinerary.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-terra/30 bg-terra/10 px-4 py-3 font-sans text-sm text-ink"
        >
          {error}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-sand/50" />
            ))}
          </div>
        ) : state.sessions.length === 0 ? (
          <div className="rounded-md border border-ink/10 bg-paper px-6 py-12 text-center font-sans text-sm text-ink/60">
            No AI-generated itineraries yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {state.sessions.map((session) => {
              const isExpanded = expandedId === session.sessionId;
              return (
                <div
                  key={session.sessionId}
                  className="rounded-lg border border-ink/10 bg-paper shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(session.sessionId)}
                    aria-expanded={isExpanded}
                    className="flex w-full flex-col gap-2 px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-sans text-sm font-semibold text-ink">
                        {session.itinerary?.title ?? "Untitled itinerary"}
                      </p>
                      <p className="mt-0.5 font-sans text-xs text-ink/60">
                        {session.itinerary?.destination} ·{" "}
                        {session.itinerary?.duration}{" "}
                        {session.itinerary?.duration === 1 ? "day" : "days"} ·{" "}
                        {session.messageCount}{" "}
                        {session.messageCount === 1 ? "message" : "messages"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {session.hasEnquiry && (
                        <span className="rounded-full bg-moss/10 px-2.5 py-1 font-sans text-xs font-medium text-moss">
                          Converted to enquiry
                        </span>
                      )}
                      <span className="font-sans text-xs text-ink/50">
                        {formatDate(session.createdAt)}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-xs text-ink/50 transition-transform",
                          isExpanded && "rotate-180",
                        )}
                        aria-hidden="true"
                      >
                        ▾
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-ink/10 px-4 py-4">
                      {detailLoading ? (
                        <p className="font-sans text-sm text-ink/60">
                          Loading conversation…
                        </p>
                      ) : detailError ? (
                        <p className="font-sans text-sm text-terra">{detailError}</p>
                      ) : detail ? (
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            {detail.messages.map((message, index) => (
                              <div
                                key={index}
                                className={cn(
                                  "max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-sm leading-relaxed",
                                  message.role === "user"
                                    ? "self-end rounded-br-sm bg-terra text-paper"
                                    : "self-start rounded-bl-sm bg-sand/60 text-ink",
                                )}
                              >
                                {message.content}
                              </div>
                            ))}
                          </div>

                          {detail.itinerary && (
                            <div className="rounded-md border border-ink/10 bg-sand/20 p-4">
                              <p className="font-display text-base text-ink">
                                {detail.itinerary.title}
                              </p>
                              <p className="mt-1 font-sans text-xs text-ink/60">
                                {detail.itinerary.destination} ·{" "}
                                {detail.itinerary.duration}{" "}
                                {detail.itinerary.duration === 1 ? "day" : "days"}
                              </p>
                              <div className="mt-3 flex flex-col gap-2">
                                {detail.itinerary.days.map((day) => (
                                  <div key={day.day}>
                                    <p className="font-sans text-sm font-medium text-ink">
                                      Day {day.day} — {day.title}
                                    </p>
                                    <ul className="mt-1 flex flex-col gap-1 pl-4 font-sans text-xs text-ink/70">
                                      {day.activities.map((activity, i) => (
                                        <li key={i}>
                                          {activity.time ? `${activity.time} — ` : ""}
                                          {activity.title}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!loading && state.sessions.length > 0 && (
        <div className="mt-6 flex items-center justify-between font-sans text-sm text-ink/70">
          <span>{rangeLabel}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={state.page <= 1 || loading}
              className={cn(
                "rounded-md border border-ink/15 px-3 py-1.5 font-sans text-sm text-ink",
                (state.page <= 1 || loading) && "cursor-not-allowed opacity-50",
              )}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(state.totalPages, p + 1))}
              disabled={state.page >= state.totalPages || loading}
              className={cn(
                "rounded-md border border-ink/15 px-3 py-1.5 font-sans text-sm text-ink",
                (state.page >= state.totalPages || loading) &&
                  "cursor-not-allowed opacity-50",
              )}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}