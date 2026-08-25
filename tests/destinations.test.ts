import { describe, it, expect } from "vitest";
import { destinations } from "@/data/destinations";

describe("destinations data", () => {
  it("has exactly 10 entries", () => {
    expect(destinations).toHaveLength(10);
  });

  it("has exactly 5 india and 5 international entries", () => {
    const india = destinations.filter((d) => d.category === "india");
    const international = destinations.filter(
      (d) => d.category === "international",
    );
    expect(india).toHaveLength(5);
    expect(international).toHaveLength(5);
  });

  it("has a non-empty id, name, image, description, and price for every entry", () => {
    for (const destination of destinations) {
      expect(destination.id).toBeTruthy();
      expect(destination.name).toBeTruthy();
      expect(destination.image).toBeTruthy();
      expect(destination.description).toBeTruthy();
      expect(destination.price).toBeGreaterThan(0);
    }
  });
});
