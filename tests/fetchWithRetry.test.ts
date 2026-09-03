import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

function jsonResponse(status: number, ok: boolean) {
  return {
    ok,
    status,
    json: async () => ({ success: ok }),
  } as Response;
}

describe("fetchWithRetry", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("succeeds immediately on a 200 response, no retries attempted", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(200, true),
    );

    const response = await fetchWithRetry("/api/chat", {}, { baseDelayMs: 1 });

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries on a thrown network error, succeeds on the 2nd attempt", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(jsonResponse(200, true));

    const response = await fetchWithRetry("/api/chat", {}, { baseDelayMs: 1 });

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("retries on a 500 response, succeeds on retry", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse(500, false))
      .mockResolvedValueOnce(jsonResponse(200, true));

    const response = await fetchWithRetry("/api/chat", {}, { baseDelayMs: 1 });

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry on a 400 response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(400, false),
    );

    const response = await fetchWithRetry("/api/chat", {}, { baseDelayMs: 1 });

    expect(response.status).toBe(400);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("exhausts retries and returns the last 5xx response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse(503, false))
      .mockResolvedValueOnce(jsonResponse(503, false));

    const response = await fetchWithRetry(
      "/api/chat",
      {},
      { maxRetries: 1, baseDelayMs: 1 },
    );

    expect(response.status).toBe(503);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("throws the last error after exhausting retries on network failures", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new TypeError("net fail 1"))
      .mockRejectedValueOnce(new TypeError("net fail 2"));

    await expect(
      fetchWithRetry("/api/chat", {}, { maxRetries: 1, baseDelayMs: 1 }),
    ).rejects.toThrow("net fail 2");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("rejects immediately if the AbortSignal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      fetchWithRetry(
        "/api/chat",
        { signal: controller.signal },
        { baseDelayMs: 1 },
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("stops retrying if the AbortSignal fires during a retry wait", async () => {
    const controller = new AbortController();
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new TypeError("Failed to fetch"),
    );

    const promise = fetchWithRetry(
      "/api/chat",
      { signal: controller.signal },
      { baseDelayMs: 50 },
    );

    setTimeout(() => controller.abort(), 5);

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});