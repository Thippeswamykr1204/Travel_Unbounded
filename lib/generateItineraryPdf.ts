import { createElement } from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { Itinerary } from "@/types/chat";

// Hex values mirror app/globals.css's design tokens — @react-pdf/renderer
// has no access to Tailwind/CSS custom properties, so they're duplicated
// literally here. This file is .ts (not .tsx), so React elements are built
// with createElement rather than JSX.
const INK = "#1c2321";
const PAPER = "#f7f4ec";
const TERRA = "#c1552c";
const SAND = "#e4dcc8";

const styles = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    color: INK,
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: `1px solid ${SAND}`,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginBottom: 6,
  },
  meta: {
    fontSize: 10,
    color: INK,
    opacity: 0.7,
  },
  daySection: {
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: TERRA,
    marginBottom: 6,
  },
  activityRow: {
    marginBottom: 6,
    paddingLeft: 8,
  },
  activityHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  activityDescription: {
    fontSize: 10,
    color: INK,
    opacity: 0.75,
    marginTop: 2,
  },
  emptyDayNote: {
    fontSize: 10,
    color: INK,
    opacity: 0.6,
  },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTop: `1px solid ${SAND}`,
    fontSize: 9,
    color: INK,
    opacity: 0.6,
  },
});

function formatBudget(estimatedBudget?: number): string | null {
  if (typeof estimatedBudget !== "number") return null;
  return `Est. budget: ₹${estimatedBudget.toLocaleString("en-IN")}`;
}

export async function generateItineraryPdf(itinerary: Itinerary): Promise<Blob> {
  const budgetLine = formatBudget(itinerary.estimatedBudget);

  const metaText = [
    itinerary.destination,
    `${itinerary.duration} ${itinerary.duration === 1 ? "day" : "days"}`,
    budgetLine,
  ]
    .filter(Boolean)
    .join(" · ");

  const daySections = itinerary.days.map((day) => {
    const activityNodes =
      day.activities.length === 0
        ? [
            createElement(
              Text,
              { key: "empty", style: styles.emptyDayNote },
              "No activities listed for this day.",
            ),
          ]
        : day.activities.map((activity, index) =>
            createElement(
              View,
              { key: `${day.day}-${index}`, style: styles.activityRow },
              createElement(
                Text,
                { style: styles.activityHeading },
                `${activity.time ? `${activity.time} — ` : ""}${activity.title}`,
              ),
              activity.description
                ? createElement(
                    Text,
                    { style: styles.activityDescription },
                    activity.description,
                  )
                : null,
            ),
          );

    return createElement(
      View,
      { key: day.day, style: styles.daySection, wrap: false },
      createElement(Text, { style: styles.dayTitle }, `Day ${day.day} — ${day.title}`),
      ...activityNodes,
    );
  });

  const doc = createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(
        View,
        { style: styles.header },
        createElement(Text, { style: styles.title }, itinerary.title),
        createElement(Text, { style: styles.meta }, metaText),
      ),
      ...daySections,
      createElement(
        View,
        { style: styles.footer },
        createElement(Text, null, "Travel Unbounded — handpicked, unhurried journeys."),
      ),
    ),
  );

  return pdf(doc).toBlob();
}