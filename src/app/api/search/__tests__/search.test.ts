import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks (must come before importing the route) ───────────────
const getCurrentUser = vi.fn();
const searchCourses = vi.fn();
const searchMessages = vi.fn();
const searchUsers = vi.fn();
const getOrSet = vi.fn();
const incr = vi.fn();
const checkRateLimit = vi.fn();
const getClientIdentifier = vi.fn(() => "client-1");

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: () => getCurrentUser(),
}));

vi.mock("@/lib/db/repository", () => ({
  repository: {
    searchCourses: (q: string, take: number) => searchCourses(q, take),
    searchMessages: (uid: string, q: string, take: number) => searchMessages(uid, q, take),
    searchUsers: (q: string, take: number) => searchUsers(q, take),
  },
}));

vi.mock("@/lib/cache", () => ({
  getOrSet: (key: string, ttl: number, fn: () => Promise<unknown>, tags?: string[]) =>
    getOrSet(key, ttl, fn, tags),
}));

vi.mock("@/lib/metrics", () => ({
  incr: (name: string) => incr(name),
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

import { GET } from "../route";

function makeReq(query: string, role = "STUDENT") {
  return new Request(`https://baseerno.ir/api/search?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: { "x-forwarded-for": "127.0.0.1" },
  });
}

const student = { id: "u-1", name: "Ali", email: "a@b.com", role: "STUDENT" as const };
const admin = { id: "u-admin", name: "Admin", email: "admin@b.com", role: "ADMIN" as const };

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockReturnValue({
      success: true,
      remaining: 119,
      resetAt: Date.now() + 60_000,
    });
    // Default: getOrSet calls the factory (no cache hit).
    getOrSet.mockImplementation(
      async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn(),
    );
  });

  it("returns 401 when not authenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await GET(makeReq("grammar"));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    getCurrentUser.mockResolvedValue(student);
    checkRateLimit.mockReturnValue({ success: false, retryAfter: 5 });
    const res = await GET(makeReq("grammar"));
    expect(res.status).toBe(429);
  });

  it("returns an empty result set for queries shorter than 2 chars", async () => {
    getCurrentUser.mockResolvedValue(student);
    const res = await GET(makeReq("g"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toEqual([]);
    expect(incr).not.toHaveBeenCalled();
  });

  it("searches courses and messages for a STUDENT (no users)", async () => {
    getCurrentUser.mockResolvedValue(student);
    searchCourses.mockResolvedValue([
      { id: "c-1", title: "گرامر", subtitle: "مقدماتی" },
    ]);
    searchMessages.mockResolvedValue([
      { id: "m-1", body: "سلام چطوری", sentAt: "2026-08-01T10:00:00.000Z" },
    ]);

    const res = await GET(makeReq("grammar"));
    expect(res.status).toBe(200);
    const body = await res.json();

    const types = body.results.map((r: { type: string }) => r.type);
    expect(types).toContain("course");
    expect(types).toContain("message");
    expect(types).not.toContain("user");

    expect(searchCourses).toHaveBeenCalledWith("grammar", 5);
    expect(searchMessages).toHaveBeenCalledWith("u-1", "grammar", 5);
    expect(searchUsers).not.toHaveBeenCalled();
    expect(incr).toHaveBeenCalledWith("search:query");
  });

  it("includes user results only for ADMIN", async () => {
    getCurrentUser.mockResolvedValue(admin);
    searchCourses.mockResolvedValue([]);
    searchMessages.mockResolvedValue([]);
    searchUsers.mockResolvedValue([
      { id: "u-9", name: "Zahra", email: "z@b.com" },
    ]);

    const res = await GET(makeReq("zahra"));
    const body = await res.json();
    expect(body.results.some((r: { type: string }) => r.type === "user")).toBe(true);
    expect(searchUsers).toHaveBeenCalledWith("zahra", 5);
  });

  it("serves cached course results without re-running the factory", async () => {
    getCurrentUser.mockResolvedValue(student);
    searchCourses.mockResolvedValue([
      { id: "c-1", title: "گرامر", subtitle: "مقدماتی" },
    ]);
    getOrSet.mockImplementation(async (key: string, _ttl: number) => {
      if (String(key).startsWith("search:courses:")) {
        return [{ id: "c-1", title: "گرامر", subtitle: "مقدماتی" }];
      }
      return [];
    });

    const res = await GET(makeReq("grammar"));
    const body = await res.json();
    expect(body.results.some((r: { type: string }) => r.type === "course")).toBe(true);
  });
});
