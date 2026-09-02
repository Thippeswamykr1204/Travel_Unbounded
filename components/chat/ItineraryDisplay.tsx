"use client";

import { useState } from "react";
import type { Itinerary } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ItineraryDisplayProps {
  itinerary: Itinerary;
}

export default function ItineraryDisplay({ itinerary }: ItineraryDisplayProps) {
  const [openDays, setOpenDays] = useState<Set<number>>(
    () => new Set(itinerary.days.length > 0 ? [itinerary.days[0]!.day] : []),
  );

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

  return (
    <div className="mt-2 w-full max-w-full rounded-lg border border-ink/10 bg-paper p-4 text-ink shadow-sm">
      <div className="border-b border-ink/10 pb-3">
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
    </div>
  );
}