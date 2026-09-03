import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useChatConversation } from "@/components/chat/useChatConversation";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function okJson(data: unknown) {
  return { ok: true, json: async () => ({ success: true, data }) } as Response;
}

describe("useChatConversation cancellation", () => {
  beforeEach(() => {
    // Default fallback so incidental calls (e.g. the fire-and-forget
    // session-persist POST) don't blow up when a test only cares about
    // mocking the /api/chat call itself.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okJson({ success: true })));
    const store: Record<string, string> = {};
    vi.stubGlobal("sessionStorage", {
      getItem(key: string) {
        return store[key] ?? null;
      },
      setItem(key: string, value: string) {
        store[key] = value;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("aborts the first request when sendMessage is called again while pending", async () => {
    const first = deferred<Response>();
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    let firstSignal: AbortSignal | undefined;
    fetchMock.mockImplementationOnce((_url: string, options: RequestInit) => {
      firstSignal = options.signal as AbortSignal;
      return first.promise;
    });
    fetchMock.mockResolvedValueOnce(
      okJson({ isItineraryReady: false, reply: "second reply" }),
    );

    const { result } = renderHook(() => useChatConversation());

    await act(async () => {
      void result.current.sendMessage("first message");
    });

    await act(async () => {
      await result.current.sendMessage("second message");
    });

    expect(firstSignal?.aborted).toBe(true);

    await waitFor(() => {
      expect(
        result.current.messages.some((m) => m.content === "second reply"),
      ).toBe(true);
    });
  });

  it("does not set error state when a request is aborted", async () => {
    const first = deferred<Response>();
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockImplementationOnce((_url: string, options: RequestInit) => {
      const signal = options.signal as AbortSignal;
      return new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    fetchMock.mockResolvedValueOnce(
      okJson({ isItineraryReady: false, reply: "second reply" }),
    );

    const { result } = renderHook(() => useChatConversation());

    await act(async () => {
      void result.current.sendMessage("first message");
    });

    await act(async () => {
      await result.current.sendMessage("second message");
    });

    expect(result.current.error).toBeNull();
    void first;
  });

  it("reset() aborts an in-flight request without setting error state", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    let capturedSignal: AbortSignal | undefined;

    fetchMock.mockImplementationOnce((_url: string, options: RequestInit) => {
      capturedSignal = options.signal as AbortSignal;
      return new Promise((_resolve, reject) => {
        capturedSignal!.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    const { result } = renderHook(() => useChatConversation());

    await act(async () => {
      void result.current.sendMessage("hello");
    });

    act(() => {
      result.current.reset();
    });

    expect(capturedSignal?.aborted).toBe(true);

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});