import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks (must come before importing the route) ───────────────
const getCurrentUser = vi.fn();
const sendMessage = vi.fn();
const isSameOriginRequest = vi.fn((_req?: Request) => true);
const checkRateLimit = vi.fn();
const getClientIdentifier = vi.fn(() => "client-1");

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: () => getCurrentUser(),
}));

// The real use-case module imports repository/events — mock those so the
// module graph loads without touching prisma-client (which throws without
// DATABASE_URL). sendMessageSchema + buildUseCaseResponse stay real.
vi.mock("@/lib/db/repository", () => ({
  repository: { findSafeUserById: vi.fn(), createMessage: vi.fn() },
}));
vi.mock("@/lib/events", () => ({ publish: vi.fn() }));

vi.mock("@/lib/useCases/messages/sendMessage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/useCases/messages/sendMessage")>();
  return {
    ...actual,
    sendMessage: (input: unknown) => sendMessage(input),
  };
});

vi.mock("@/lib/csrf", () => ({
  isSameOriginRequest: (req: Request) => isSameOriginRequest(req),
  csrfRejectedResponse: () =>
    new Response(JSON.stringify({ error: "csrf" }), { status: 403 }),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (id: string, config?: unknown) => checkRateLimit(id, config),
  getClientIdentifier: () => getClientIdentifier(),
  RATE_LIMIT_PRESETS: {
    AUTH: { windowMs: 60_000, max: 5, burst: 2, burstWindowMs: 10_000 },
    API: { windowMs: 60_000, max: 20, burst: 5, burstWindowMs: 5_000 },
    READ: { windowMs: 60_000, max: 60, burst: 10, burstWindowMs: 2_000 },
    SENSITIVE: { windowMs: 120_000, max: 3, burst: 1, burstWindowMs: 30_000 },
  },
  tooManyRequestsResponse: (retryAfter: number) =>
    new Response(JSON.stringify({ error: "rate", retryAfter }), {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }),
}));

import { POST } from "../route";

function makeReq(body: unknown, origin = "https://baseerno.ir") {
  return new Request("https://baseerno.ir/api/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify(body),
  });
}

const authenticatedUser = {
  id: "u-1",
  name: "Ali",
  email: "ali@test.com",
  role: "STUDENT" as const,
};

describe("POST /api/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSameOriginRequest.mockReturnValue(true);
    checkRateLimit.mockReturnValue({
      success: true,
      remaining: 19,
      resetAt: Date.now() + 60_000,
    });
    getCurrentUser.mockResolvedValue(authenticatedUser);
  });

  it("returns 403 on cross-origin requests", async () => {
    isSameOriginRequest.mockReturnValue(false);
    const res = await POST(makeReq({ receiverId: "u-2", body: "سلام" }));
    expect(res.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq({ receiverId: "u-2", body: "سلام" }));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimit.mockReturnValue({ success: false, retryAfter: 20 });
    const res = await POST(makeReq({ receiverId: "u-2", body: "سلام" }));
    expect(res.status).toBe(429);
  });

  it("returns 400 on unparsable JSON body", async () => {
    const req = new Request("https://baseerno.ir/api/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://baseerno.ir",
        "x-forwarded-for": "127.0.0.1",
      },
      body: "{not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 422 for invalid body (missing receiverId)", async () => {
    const res = await POST(makeReq({ body: "سلام" }));
    expect(res.status).toBe(422);
  });

  it("returns 422 for empty message body", async () => {
    const res = await POST(makeReq({ receiverId: "u-2", body: "" }));
    expect(res.status).toBe(422);
  });

  it("returns 404 when the receiver does not exist", async () => {
    sendMessage.mockResolvedValue({
      ok: false,
      error: "گیرنده یافت نشد.",
      status: 404,
    });
    const res = await POST(makeReq({ receiverId: "missing", body: "سلام" }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("گیرنده یافت نشد.");
  });

  it("creates the message and returns 201 on success", async () => {
    sendMessage.mockResolvedValue({
      ok: true,
      message: {
        id: "m-1",
        senderId: "u-1",
        receiverId: "u-2",
        body: "سلام",
      },
    });
    const res = await POST(makeReq({ receiverId: "u-2", body: "سلام" }));
    expect(res.status).toBe(201);
    // Sender context is injected from the session, not the client body.
    expect(sendMessage).toHaveBeenCalledWith({
      receiverId: "u-2",
      body: "سلام",
      senderId: "u-1",
      senderName: "Ali",
    });
    const body = await res.json();
    expect(body.message.id).toBe("m-1");
  });
});
