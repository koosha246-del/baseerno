import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ────────────────────────────────────────────────
const checkRateLimit = vi.fn();
const getClientIdentifier = vi.fn(() => "client-1");
const isSameOriginRequest = vi.fn((_req?: Request) => true);

const findUserByEmail = vi.fn();
const createPasswordReset = vi.fn();
const publish = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (id: string, config?: unknown) => checkRateLimit(id, config),
  getClientIdentifier: () => getClientIdentifier(),
  RATE_LIMIT_PRESETS: {
    AUTH: { windowMs: 60_000, max: 5, burst: 2, burstWindowMs: 10_000 },
  },
  tooManyRequestsResponse: (retryAfter: number) =>
    new Response(JSON.stringify({ error: "rate", retryAfter }), {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }),
}));
vi.mock("@/lib/csrf", () => ({
  isSameOriginRequest: (req: Request) => isSameOriginRequest(req),
  csrfRejectedResponse: () =>
    new Response(JSON.stringify({ error: "csrf" }), { status: 403 }),
}));
vi.mock("@/lib/db/repository", () => ({
  repository: {
    findUserByEmail: (email: string) => findUserByEmail(email),
    createPasswordReset: (userId: string) => createPasswordReset(userId),
  },
}));
vi.mock("@/lib/events", () => ({
  publish: (event: unknown) => publish(event),
}));
vi.mock("@/config/site", () => ({
  siteConfig: { url: "https://baseerno.ir" },
}));

import { POST } from "../forgot-password/route";

function makeReq(body: unknown, origin = "https://baseerno.ir") {
  return new Request("https://baseerno.ir/api/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSameOriginRequest.mockReturnValue(true);
    checkRateLimit.mockReturnValue({ success: true, remaining: 4, resetAt: Date.now() + 60_000 });
    findUserByEmail.mockResolvedValue({ id: "u-1", name: "علی", email: "ali@example.com" });
    createPasswordReset.mockResolvedValue({ token: "reset-token" });
    publish.mockResolvedValue(undefined);
  });

  it("returns 403 on cross-origin requests", async () => {
    isSameOriginRequest.mockReturnValue(false);
    const res = await POST(makeReq({ email: "a@b.com" }));
    expect(res.status).toBe(403);
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimit.mockReturnValue({ success: false, retryAfter: 30 });
    const res = await POST(makeReq({ email: "a@b.com" }));
    expect(res.status).toBe(429);
  });

  it("returns 400 on a non-JSON body", async () => {
    const req = new Request("https://baseerno.ir/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://baseerno.ir" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 422 on an invalid email", async () => {
    const res = await POST(makeReq({ email: "not-an-email" }));
    expect(res.status).toBe(422);
    expect(findUserByEmail).not.toHaveBeenCalled();
  });

  it("returns 200 for an unknown email without creating a reset (anti-enumeration)", async () => {
    findUserByEmail.mockResolvedValue(null);
    const res = await POST(makeReq({ email: "ghost@example.com" }));
    expect(res.status).toBe(200);
    expect(createPasswordReset).not.toHaveBeenCalled();
  });

  it("creates a reset and returns 200 on success", async () => {
    const res = await POST(makeReq({ email: "ali@example.com" }));
    expect(res.status).toBe(200);
    expect(createPasswordReset).toHaveBeenCalledWith("u-1");
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: "user:password-reset", email: "ali@example.com" }),
    );
  });
});
