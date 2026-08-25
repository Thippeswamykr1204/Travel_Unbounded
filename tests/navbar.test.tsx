import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Navbar from "@/components/layout/Navbar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Navbar", () => {
  it("renders without crashing", () => {
    render(<Navbar />);
    expect(
      screen.getByRole("link", { name: /travel unbounded/i }),
    ).toBeInTheDocument();
  });

  it("has the mobile menu closed by default", () => {
    render(<Navbar />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the mobile menu when the hamburger is clicked", () => {
    render(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes the mobile menu when the close button is clicked", async () => {
    render(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const closeButtons = screen.getAllByRole("button", {
      name: /close menu/i,
    });
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    // The panel now plays a Motion exit transition before unmounting, so
    // wait for it to finish clearing the DOM instead of asserting instantly.
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("closes the mobile menu when Escape is pressed", async () => {
    render(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});