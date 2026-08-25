import { describe, it, expect } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("robots.ts", () => {
  it("allows all crawlers and points to the sitemap", () => {
    const result = robots();
    expect(result.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});

describe("sitemap.ts", () => {
  it("lists the home, about, and contact routes", () => {
    const result = sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls).toContain("https://www.travelunbounded.com");
    expect(urls).toContain("https://www.travelunbounded.com/about");
    expect(urls).toContain("https://www.travelunbounded.com/contact");
    expect(result).toHaveLength(3);
  });

  it("gives every entry a changeFrequency and priority", () => {
    const result = sitemap();
    for (const entry of result) {
      expect(entry.changeFrequency).toBeTruthy();
      expect(typeof entry.priority).toBe("number");
    }
  });
});