import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatWidget from "@/components/chat/ChatWidget";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

function mockFetchOnce(data: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data }),
    }),
  );
}

describe("ChatWidget", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a toggle button, closed by default", () => {
    render(<ChatWidget />);
    expect(screen.getByRole("button", { name: /open chat/i })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the chat window and shows the seeded assistant message on toggle click", () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/where are you dreaming of going/i),
    ).toBeInTheDocument();
  });

  it("sends a typed message via fetch and displays the assistant's reply", async () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

    mockFetchOnce({
      isItineraryReady: false,
      reply: "Great choice — how many days are you thinking?",
    });

    const input = screen.getByLabelText(/type a message/i);
    fireEvent.change(input, { target: { value: "I want to go to Goa" } });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({ method: "POST" }),
    );

    await waitFor(() =>
      expect(
        screen.getByText(/how many days are you thinking/i),
      ).toBeInTheDocument(),
    );
  });

  it("shows quick-reply chips before any user message, and hides them after one is sent", async () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

    expect(screen.getByRole("button", { name: /wildlife safari/i })).toBeInTheDocument();

    mockFetchOnce({ isItineraryReady: false, reply: "Wildlife it is!" });
    fireEvent.click(screen.getByRole("button", { name: /wildlife safari/i }));

    await waitFor(() =>
      expect(screen.getByText(/wildlife it is!/i)).toBeInTheDocument(),
    );

    expect(
      screen.queryByRole("button", { name: /wildlife safari/i }),
    ).not.toBeInTheDocument();
  });

  it('resets the message list back to just the seed message on "Start over"', async () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

    mockFetchOnce({ isItineraryReady: false, reply: "Sounds lovely!" });
    const input = screen.getByLabelText(/type a message/i);
    fireEvent.change(input, { target: { value: "A beach trip please" } });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() =>
      expect(screen.getByText(/sounds lovely!/i)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /start over/i }));

    expect(screen.queryByText(/sounds lovely!/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/where are you dreaming of going/i),
    ).toBeInTheDocument();
  });

  it("closes the window when Escape is pressed", () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});