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
    expect(screen.getByText(/bengaluru/i)).toBeInTheDocument();
    expect(screen.getByText(/kochi/i)).toBeInTheDocument();
    expect(screen.getByText(/nairobi/i)).toBeInTheDocument();
  });
});