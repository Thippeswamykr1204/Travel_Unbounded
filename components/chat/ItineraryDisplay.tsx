"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Itinerary } from "@/types/chat";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { generateItineraryPdf } from "@/lib/generateItineraryPdf";

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  sessionId?: string;
}

function buildPlainTextItinerary(itinerary: Itinerary): string {
  const lines: string[] = [];

  lines.push(itinerary.title);
  const metaParts = [
    itinerary.destination,
    `${itinerary.duration} ${itinerary.duration === 1 ? "day" : "days"}`,
  ];
  if (typeof itinerary.estimatedBudget === "number") {
    metaParts.push(`Est. budget: ₹${itinerary.estimatedBudget.toLocaleString("en-IN")}`);
  }
  lines.push(metaParts.join(" · "));
  lines.push("");

  for (const day of itinerary.days) {
    lines.push(`Day ${day.day} — ${day.title}`);
    if (day.activities.length === 0) {
      lines.push("  No activities listed for this day.");
    } else {
      for (const activity of day.activities) {
        const heading = activity.time
          ? `  ${activity.time} — ${activity.title}`
          : `  ${activity.title}`;
        lines.push(heading);
        if (activity.description) {
          lines.push(`    ${activity.description}`);
        }
      }
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ItineraryDisplay({ itinerary, sessionId }: ItineraryDisplayProps) {
  const router = useRouter();
  const [openDays, setOpenDays] = useState<Set<number>>(
    () => new Set(itinerary.days.length > 0 ? [itinerary.days[0]!.day] : []),
  );
  const [copyState, setCopyState] = useState<"idle" | "copied" | "unavailable">(
    "idle",
  );
  const [pdfState, setPdfState] = useState<"idle" | "generating" | "error">("idle");

  useEffect(() => {
    if (copyState === "idle") return;
    const timeout = setTimeout(() => setCopyState("idle"), 2500);
    return () => clearTimeout(timeout);
  }, [copyState]);

  const toggleDay = (day: number) => {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const handleEnquire = () => {
    const params = new URLSearchParams({ destination: itinerary.destination });
    if (sessionId) {
      params.set("chatSessionId", sessionId);
    }
    router.push(`/contact?${params.toString()}`);
  };

  const handleCopy = async () => {
    const text = buildPlainTextItinerary(itinerary);

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyState("unavailable");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
    } catch {
      setCopyState("unavailable");
    }
  };

  const handleDownload = async () => {
    setPdfState("generating");
    try {
      const blob = await generateItineraryPdf(itinerary);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `travel-unbounded-${slugify(itinerary.destination)}-itinerary.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setPdfState("idle");
    } catch {
      setPdfState("error");
    }
  };

  return (
    <div className="mt-2 w-full max-w-full rounded-lg border border-ink/10 bg-paper p-4 text-ink shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-ink/10 pb-3">
        <div>
          <p className="font-display text-lg leading-snug text-ink">
            {itinerary.title}
          </p>
          <p className="mt-1 font-sans text-xs text-ink/60">
            {itinerary.destination} · {itinerary.duration}{" "}
            {itinerary.duration === 1 ? "day" : "days"}
            {typeof itinerary.estimatedBudget === "number" && (
              <> · Est. ₹{itinerary.estimatedBudget.toLocaleString("en-IN")}</>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ink/15 px-2.5 py-1.5 font-sans text-xs font-medium text-ink/70 transition-colors hover:bg-sand/50 hover:text-ink"
          aria-label="Copy itinerary"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copyState === "copied"
            ? "Copied!"
            : copyState === "unavailable"
              ? "Copy unavailable"
              : "Copy"}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {itinerary.days.map((day) => {
          const isOpen = openDays.has(day.day);
          return (
            <div
              key={day.day}
              className="overflow-hidden rounded-md border border-ink/10"
            >
              <button
                type="button"
                onClick={() => toggleDay(day.day)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 bg-sand/40 px-3 py-2 text-left font-sans text-sm font-medium text-ink"
              >
                <span>
                  Day {day.day} — {day.title}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-xs text-ink/50 transition-transform",
                    isOpen && "rotate-180",
                  )}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {isOpen && (
                <ul className="flex flex-col gap-2 px-3 py-3">
                  {day.activities.map((activity, index) => (
                    <li key={`${day.day}-${index}`} className="font-sans text-sm">
                      <div className="flex items-baseline gap-2">
                        {activity.time && (
                          <span className="font-mono text-xs uppercase tracking-wide text-terra">
                            {activity.time}
                          </span>
                        )}
                        <span className="font-medium text-ink">
                          {activity.title}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="mt-0.5 text-xs leading-relaxed text-ink/70">
                          {activity.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-3">
        <Button
          variant="primary"
          onClick={handleEnquire}
          className="text-xs"
        >
          Enquire about this itinerary
        </Button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={pdfState === "generating"}
          className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-terra underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pdfState === "generating" ? "Preparing PDF…" : "Download PDF"}
        </button>

        {pdfState === "error" && (
          <span className="font-sans text-xs text-terra">
            Couldn&apos;t generate the PDF — please try again.
          </span>
        )}
      </div>
    </div>
  );
}