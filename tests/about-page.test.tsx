import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import About from "@/app/about/page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/about",
}));

describe("About page", () => {
  it("renders the story content", () => {
    render(<About />);
    expect(
      screen.getByText(/built around the people taking them/i),
    ).toBeInTheDocument();
  });

  it("renders all three office cities", () => {
    render(<About />);
    expect(screen.getAllByText(/bengaluru/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/kochi/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/nairobi/i).length).toBeGreaterThan(0);
  });
});