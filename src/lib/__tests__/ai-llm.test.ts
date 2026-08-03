import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Module mocks ────────────────────────────────────────────────
const envMock = vi.hoisted(() => ({
  AI_API_KEY: undefined as string | undefined,
  AI_BASE_URL: undefined as string | undefined,
  AI_MODEL: undefined as string | undefined,
}));

vi.mock("@/lib/env", () => ({ env: envMock }));

const fetchMock = vi.fn();

import { completeChat, LlmError, MAX_TOKENS, isAiEnabled } from "@/lib/ai/llm";

describe("ai/llm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.AI_API_KEY = undefined;
    envMock.AI_BASE_URL = undefined;
    envMock.AI_MODEL = undefined;
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("isAiEnabled is false without a key", () => {
    expect(isAiEnabled()).toBe(false);
  });

  it("returns a Persian mock reply when no API key is configured", async () => {
    const result = await completeChat([
      { role: "system", content: "system" },
      { role: "user", content: "تفاوت present perfect و past simple چیست؟" },
    ]);

    expect(result.mocked).toBe(true);
    expect(result.content.length).toBeGreaterThan(0);
    // Persian content
    expect(/[\u0600-\u06FF]/.test(result.content)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls the OpenAI-compatible endpoint with a 200-token cap", async () => {
    envMock.AI_API_KEY = "sk-test";
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "پاسخ تستی" } }] }),
        { status: 200 },
      ),
    );

    const result = await completeChat([
      { role: "user", content: "سلام" },
    ]);

    expect(result.mocked).toBe(false);
    expect(result.content).toBe("پاسخ تستی");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("chat/completions");
    const body = JSON.parse(String(init.body));
    expect(body.max_tokens).toBe(MAX_TOKENS);
    expect(body.max_tokens).toBe(200);
  });

  it("does not log chat content on HTTP errors", async () => {
    envMock.AI_API_KEY = "sk-test";
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      completeChat([{ role: "user", content: "SECRET_PRIVATE_MESSAGE" }]),
    ).rejects.toBeInstanceOf(LlmError);
    // Capture BEFORE restoring — mockRestore clears mock.calls.
    const logged = errorSpy.mock.calls.map((c) => String(c[0])).join(" ");
    errorSpy.mockRestore();

    expect(logged).not.toContain("SECRET_PRIVATE_MESSAGE");
  });

  it("throws a Persian network error when fetch fails", async () => {
    envMock.AI_API_KEY = "sk-test";
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(
      completeChat([{ role: "user", content: "سلام" }]),
    ).rejects.toThrow("خطا در اتصال");
  });

  it("throws a Persian rate-limit error on 429", async () => {
    envMock.AI_API_KEY = "sk-test";
    fetchMock.mockResolvedValue(new Response("rate limited", { status: 429 }));

    await expect(
      completeChat([{ role: "user", content: "سلام" }]),
    ).rejects.toThrow("شلوغ");
  });
});
