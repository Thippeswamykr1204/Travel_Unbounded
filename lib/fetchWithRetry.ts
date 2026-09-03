/**
 * Wraps native fetch with retry-with-backoff for transient network failures.
 *
 * Retries on:
 *  - fetch throwing (network drop, DNS failure, etc.)
 *  - 5xx responses
 * Does NOT retry on:
 *  - 4xx responses (legitimate client errors)
 *  - any response that resolves (including the app's own graceful-fallback
 *    200 JSON responses) — those are valid, complete responses
 *
 * Respects an incoming AbortSignal: if it fires mid-retry-wait, the abort
 * is rethrown immediately rather than swallowed.
 */

interface RetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
}

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 500;
const JITTER_RATIO = 0.2;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function backoffDelay(attempt: number, baseDelayMs: number): number {
  const raw = baseDelayMs * 2 ** attempt;
  const jitter = raw * JITTER_RATIO * (Math.random() * 2 - 1);
  return Math.max(0, raw + jitter);
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit & { signal?: AbortSignal } = {},
  config?: RetryConfig,
): Promise<Response> {
  const maxRetries = config?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = config?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const signal = options.signal;

  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) {
      throw signal.reason ?? new DOMException("Aborted", "AbortError");
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok && response.status >= 500) {
        lastResponse = response;
        if (attempt < maxRetries) {
          await sleep(backoffDelay(attempt, baseDelayMs), signal);
          continue;
        }
        return response;
      }

      return response;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw err;
      }

      lastError = err;
      if (attempt < maxRetries) {
        await sleep(backoffDelay(attempt, baseDelayMs), signal);
        continue;
      }
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError;
}