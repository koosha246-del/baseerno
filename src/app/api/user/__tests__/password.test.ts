import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks (must come before importing the route) ───────────────
const getCurrentUser = vi.fn();
const findUserById = vi.fn();
const updatePassword = vi.fn();
const verifyPassword = vi.fn();
const hashPassword = vi.fn();
const isSameOriginRequest = vi.fn((_req?: Request) => true);
const checkRateLimit = vi.fn();
const getClientIdentifier = vi.fn(() => "client-1");

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: () => getCurrentUser(),
}));

vi.mock("@/lib/db/repository", () => ({
  repository: {
    findUserById: (id: string) => findUserById(id),
    updatePassword: (id: string, hash: string) => updatePassword(id, hash),
  },
}));

vi.mock("@/lib/auth/password", () => ({
  verifyPassword: (pw: string, hash: string) => verifyPassword(pw, hash),
  hashPassword: (pw: string) => hashPassword(pw),
}));

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

import { PATCH } from "../password/route";

function makeReq(body: unknown, origin = "https://baseerno.ir") {
  return new Request("https://baseerno.ir/api/user/password", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      origin,
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify(body),
  });
}

const authenticatedUser = { id: "u-1", name: "Ali", email: "a@b.com", role: "STUDENT" as const };

describe("PATCH /api/user/password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSameOriginRequest.mockReturnValue(true);
    checkRateLimit.mockReturnValue({
      success: true,
      remaining: 4,
      resetAt: Date.now() + 60_000,
    });
    getCurrentUser.mockResolvedValue(authenticatedUser);
    verifyPassword.mockResolvedValue(true);
    hashPassword.mockResolvedValue("hashed-new-pw");
  });

  it("returns 403 on cross-origin requests", async () => {
    isSameOriginRequest.mockReturnValue(false);
    const res = await PATCH(makeReq({ currentPassword: "old", newPassword: "newpass" }));
    expect(res.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await PATCH(makeReq({ currentPassword: "old", newPassword: "newpass" }));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimit.mockReturnValue({ success: false, retryAfter: 30 });
    const res = await PATCH(makeReq({ currentPassword: "old", newPassword: "newpass" }));
    expect(res.status).toBe(429);
  });

  it("returns 400 on unparsable JSON body", async () => {
    const req = new Request("https://baseerno.ir/api/user/password", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "https://baseerno.ir",
        "x-forwarded-for": "127.0.0.1",
      },
      body: "{bad",
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it("returns 422 when newPassword is shorter than 6 chars", async () => {
    const res = await PATCH(makeReq({ currentPassword: "old", newPassword: "12345" }));
    expect(res.status).toBe(422);
  });

  it("returns 422 when currentPassword is missing", async () => {
    const res = await PATCH(makeReq({ newPassword: "newpass" }));
    expect(res.status).toBe(422);
  });

  it("returns 404 when the user is not found", async () => {
    findUserById.mockResolvedValue(null);
    const res = await PATCH(makeReq({ currentPassword: "old", newPassword: "newpass" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when the current password is wrong", async () => {
    findUserById.mockResolvedValue({ id: "u-1", passwordHash: "hash" });
    verifyPassword.mockResolvedValue(false);
    const res = await PATCH(makeReq({ currentPassword: "wrong", newPassword: "newpass" }));
    expect(res.status).toBe(400);
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("hashes the new password and updates it on success", async () => {
    findUserById.mockResolvedValue({ id: "u-1", passwordHash: "hash" });
    const res = await PATCH(makeReq({ currentPassword: "old", newPassword: "newpass" }));
    expect(res.status).toBe(200);
    expect(verifyPassword).toHaveBeenCalledWith("old", "hash");
    expect(hashPassword).toHaveBeenCalledWith("newpass");
    expect(updatePassword).toHaveBeenCalledWith("u-1", "hashed-new-pw");
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
