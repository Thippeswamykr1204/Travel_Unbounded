import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BookingForm from "@/components/contact/BookingForm";

describe("BookingForm", () => {
  it("renders without crashing", () => {
    render(<BookingForm />);
    expect(
      screen.getByRole("button", { name: /send enquiry/i }),
    ).toBeInTheDocument();
  });

  it("shows a validation error when submitted empty", async () => {
    const user = userEvent.setup();
    render(<BookingForm />);

    await user.click(screen.getByRole("button", { name: /send enquiry/i }));

    expect(
      await screen.findByText(/enter your full name/i),
    ).toBeInTheDocument();
  });

  it("shows the success state once submitted with valid data", async () => {
    const user = userEvent.setup();
    render(<BookingForm />);

    await user.type(screen.getByLabelText(/full name/i), "Asha Rao");
    await user.selectOptions(
      screen.getByLabelText(/country code/i),
      "+91",
    );
    await user.type(screen.getByLabelText(/contact number/i), "9876543210");
    await user.type(screen.getByLabelText(/email/i), "asha@example.com");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const isoDate = tomorrow.toISOString().split("T")[0];
    await user.type(screen.getByLabelText(/date of travel/i), isoDate);

    const peopleInput = screen.getByLabelText(/number of people/i);
    await user.clear(peopleInput);
    await user.type(peopleInput, "2");

    await user.selectOptions(
      screen.getByLabelText(/hotel category/i),
      "Deluxe",
    );

    await user.click(screen.getByRole("button", { name: /send enquiry/i }));

    expect(
      await screen.findByText(/enquiry sent/i, {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/one of our travel experts will contact you/i),
    ).toBeInTheDocument();
  }, 10000);

  it("keeps the honeypot field present but hidden from sighted users", () => {
    render(<BookingForm />);
    const honeypot = screen.getByLabelText(/company website/i);

    expect(honeypot).toBeInTheDocument();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot.parentElement).toHaveClass("overflow-hidden");
    expect(honeypot).toHaveValue("");
  });
});