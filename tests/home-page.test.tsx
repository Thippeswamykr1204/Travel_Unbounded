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

  it("links a destination card's explore link to the contact form with its destination id", () => {
    render(<Home />);
    const exploreLink = screen.getAllByRole("link", {
      name: /explore destination/i,
    })[0];
    expect(exploreLink).toHaveAttribute(
      "href",
      expect.stringContaining("?destination="),
    );
  });
});