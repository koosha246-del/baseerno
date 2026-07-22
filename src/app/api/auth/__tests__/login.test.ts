import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks (must come before importing the route) ───────────────
const findUserByEmail = vi.fn();
const verifyPassword = vi.fn();
const setSession = vi.fn();
const checkRateLimit = vi.fn();
const getClientIdentifier = vi.fn(() => "client-1");
const isSameOriginRequest = vi.fn((_req?: Request) => true);

vi.mock("@/lib/db/repository", () => ({
  repository: { findUserByEmail: (email: string) => findUserByEmail(email) },
}));
vi.mock("@/lib/auth/password", () => ({
  verifyPassword: (pw: string, hash: string) => verifyPassword(pw, hash),
}));
vi.mock("@/lib/auth/session", () => ({
  setSession: (user: unknown) => setSession(user),
}));
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

import { POST } from "../login/route";

function makeReq(body: unknown, origin = "https://baseerno.ir") {
  return new Request("https://baseerno.ir/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSameOriginRequest.mockReturnValue(true);
    checkRateLimit.mockReturnValue({
      success: true,
      remaining: 4,
      resetAt: Date.now() + 60_000,
    });
    getClientIdentifier.mockReturnValue("client-1");
  });

  it("returns 403 on cross-origin requests", async () => {
    isSameOriginRequest.mockReturnValue(false);
    const res = await POST(makeReq({ email: "a@b.com", password: "p" }));
    expect(res.status).toBe(403);
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimit.mockReturnValue({ success: false, retryAfter: 30 });
    const res = await POST(makeReq({ email: "a@b.com", password: "p" }));
    expect(res.status).toBe(429);
  });

  it("returns 422 on invalid body", async () => {
    const res = await POST(makeReq({ email: "not-an-email" }));
    expect(res.status).toBe(422);
  });

  it("returns 401 when user not found", async () => {
    findUserByEmail.mockResolvedValue(null);
    const res = await POST(makeReq({ email: "no@user.com", password: "p" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 on wrong password", async () => {
    findUserByEmail.mockResolvedValue({ id: "u-1", email: "a@b.com", role: "STUDENT" });
    verifyPassword.mockResolvedValue(false);
    const res = await POST(makeReq({ email: "a@b.com", password: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("sets the session and returns 200 on success", async () => {
    findUserByEmail.mockResolvedValue({
      id: "u-1",
      email: "a@b.com",
      role: "STUDENT",
      name: "Ali",
    });
    verifyPassword.mockResolvedValue(true);
    const res = await POST(makeReq({ email: "a@b.com", password: "right" }));
    expect(res.status).toBe(200);
    expect(setSession).toHaveBeenCalledOnce();
    const body = await res.json();
    expect(body.user.email).toBe("a@b.com");
  });
});
