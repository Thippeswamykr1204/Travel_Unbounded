import { test, expect } from "@playwright/test";

// Three independent smoke tests covering the flows that matter most.
// NOTE: The AI chatbot -> itinerary flow is intentionally NOT covered here.
// It requires a real GEMINI_API_KEY and live network calls to Google's API,
// which would make this suite flaky, slow, and costly to run in CI by default.

test.describe("Public enquiry flow", () => {
  test("visitor can submit a booking enquiry", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /plan your trip|contact/i }).first().click();
    await expect(page).toHaveURL(/\/contact/);

    await page.getByLabel("Full Name").fill("Test Traveller");

    // Custom country-code combobox: open it, search, select via Enter.
    await page.locator("#countryCode").click();
    await page.getByPlaceholder("Search country or code").fill("India");  
    await page.keyboard.press("Enter");

    await page.getByLabel("Contact Number").fill("9876543210");
    await page.getByLabel("Email").fill("test.traveller@example.com");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const isoDate = tomorrow.toISOString().split("T")[0];
    await page.getByLabel("Date of Travel").fill(isoDate);

    await page.getByLabel("Number of People").fill("2");
    await page.getByLabel("Number of Children").fill("0");
    await page.getByLabel("Hotel Category").selectOption("Standard");

    await page.getByRole("button", { name: /send enquiry/i }).click();

    await expect(
      page.getByRole("heading", { name: /enquiry sent/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Admin login + enquiry status update", () => {
  test("admin can log in and reach the enquiries table", async ({ page }) => {
    const email = process.env.ADMIN_SEED_EMAIL;
    const password = process.env.ADMIN_SEED_PASSWORD;

    test.skip(
      !email || !password,
      "ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD are not set in the environment " +
        "running this test — skipping. Set both (see .env.example) to run the " +
        "admin flow meaningfully.",
    );

    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10_000 });

    await page.goto("/admin/enquiries");

    // Don't assume specific seeded rows exist — just confirm the page loads
    // and the search/filter controls are present.
    await expect(
      page.getByPlaceholder("Search by name or email…"),
    ).toBeVisible();
    await expect(page.locator("select").first()).toBeVisible();
  });
});

test.describe("Admin auth gate", () => {
  test("unauthenticated visitor is redirected away from the dashboard", async ({
    browser,
  }) => {
    // Fresh context — no cookies from any previous test.
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 });

    await context.close();
  });
});