import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ItineraryDisplay from "@/components/chat/ItineraryDisplay";
import { generateItineraryPdf } from "@/lib/generateItineraryPdf";
import type { Itinerary } from "@/types/chat";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const sampleItinerary: Itinerary = {
  title: "Slow Days in Goa",
  destination: "Goa",
  duration: 3,
  estimatedBudget: 45000,
  days: [
    {
      day: 1,
      title: "Arrival and the old quarter",
      activities: [
        { time: "Morning", title: "Settle in", description: "Check in and unwind." },
        { title: "Wander Fontainhas" },
      ],
    },
    {
      day: 2,
      title: "The coast",
      activities: [{ time: "Afternoon", title: "Beach time" }],
    },
  ],
};

const minimalItinerary: Itinerary = {
  title: "Quick Trip",
  destination: "Kerala",
  duration: 1,
  days: [
    {
      day: 1,
      title: "One busy day",
      activities: [{ title: "Backwater cruise" }],
    },
  ],
};

describe("ItineraryDisplay actions", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('navigates to /contact with the correct destination query param on "Enquire"', () => {
    render(<ItineraryDisplay itinerary={sampleItinerary} />);

    fireEvent.click(
      screen.getByRole("button", { name: /enquire about this itinerary/i }),
    );

    expect(pushMock).toHaveBeenCalledWith("/contact?destination=Goa");
  });

  it("calls navigator.clipboard.writeText with the title and an activity title on Copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<ItineraryDisplay itinerary={sampleItinerary} />);
    fireEvent.click(screen.getByRole("button", { name: /copy itinerary/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copiedText = writeText.mock.calls[0][0] as string;

    expect(copiedText).toContain(sampleItinerary.title);
    expect(copiedText).toContain("Settle in");
  });
});

describe("generateItineraryPdf", () => {
  it("resolves to a Blob for a minimal valid itinerary", async () => {
    const blob = await generateItineraryPdf(minimalItinerary);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it("does not throw for an itinerary missing estimatedBudget and activity descriptions", async () => {
    await expect(generateItineraryPdf(sampleItinerary)).resolves.toBeInstanceOf(Blob);
  });
});