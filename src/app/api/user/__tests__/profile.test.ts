import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks (must come before importing the route) ───────────────
const getCurrentUser = vi.fn();
const updateUser = vi.fn();
const revalidateTag = vi.fn();
const isSameOriginRequest = vi.fn((_req?: Request) => true);
const checkRateLimit = vi.fn();
const getClientIdentifier = vi.fn(() => "client-1");

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: () => getCurrentUser(),
}));

vi.mock("@/lib/db/repository", () => ({
  repository: { updateUser: (id: string, data: unknown) => updateUser(id, data) },
}));

vi.mock("next/cache", () => ({
  revalidateTag: (tag: string) => revalidateTag(tag),
}));

vi.mock("@/lib/cache-tags", () => ({
  CACHE_TAGS: {
    users: "users",
    user: (id: string) => `user:${id}`,
  },
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

import { PATCH } from "../profile/route";

function makeReq(body: unknown, origin = "https://baseerno.ir") {
  return new Request("https://baseerno.ir/api/user/profile", {
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

describe("PATCH /api/user/profile", () => {
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
    const res = await PATCH(makeReq({ name: "Ali Reza" }));
    expect(res.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await PATCH(makeReq({ name: "Ali Reza" }));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimit.mockReturnValue({ success: false, retryAfter: 20 });
    const res = await PATCH(makeReq({ name: "Ali Reza" }));
    expect(res.status).toBe(429);
  });

  it("returns 400 on unparsable JSON body", async () => {
    const req = new Request("https://baseerno.ir/api/user/profile", {
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

  it("returns 422 when name is shorter than 3 chars", async () => {
    const res = await PATCH(makeReq({ name: "Ab" }));
    expect(res.status).toBe(422);
  });

  it("returns 422 when bio exceeds 500 chars", async () => {
    const res = await PATCH(makeReq({ bio: "x".repeat(501) }));
    expect(res.status).toBe(422);
  });

  it("returns 404 when the user is not found", async () => {
    updateUser.mockResolvedValue(null);
    const res = await PATCH(makeReq({ name: "Ali Reza" }));
    expect(res.status).toBe(404);
  });

  it("updates the profile and revalidates user cache tags", async () => {
    updateUser.mockResolvedValue({
      id: "u-1",
      name: "Ali Reza",
      phone: "09121234567",
      bio: "مدرس",
    });
    const res = await PATCH(makeReq({ name: "Ali Reza", phone: "09121234567" }));
    expect(res.status).toBe(200);
    expect(updateUser).toHaveBeenCalledWith("u-1", {
      name: "Ali Reza",
      phone: "09121234567",
    });
    expect(revalidateTag).toHaveBeenCalledWith("users");
    expect(revalidateTag).toHaveBeenCalledWith("user:u-1");
    const body = await res.json();
    expect(body.user.name).toBe("Ali Reza");
  });
});
