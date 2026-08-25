import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders the hero headline", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /the best journeys aren't sold from a catalogue/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders at least one destination card", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 3, name: /kerala/i }),
    ).toBeInTheDocument();
  });
});