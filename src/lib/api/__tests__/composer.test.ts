import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "../composer";

// ─── Mocks ───────────────────────────────────────────────────────

// vi.mock is hoisted — keep all mock factories above the `vi.mock` calls.
vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
}));
vi.mock("@/lib/csrf", () => ({
  isSameOriginRequest: vi.fn().mockReturnValue(true),
  csrfRejectedResponse: vi.fn(() =>
    new Response(JSON.stringify({ error: "CSRF" }), { status: 403 }),
  ),
}));
// The composer uses the in-memory rate limiter when REDIS_URL is absent.
// Stub it so tests don't accumulate state.
vi.mock("@/lib/rate-limit-async", () => ({
  checkRateLimitAsync: vi.fn().mockResolvedValue({
    success: true,
    remaining: 99,
    resetAt: Date.now() + 60_000,
  }),
}));

import { getCurrentUser } from "@/lib/auth/session";
import { isSameOriginRequest } from "@/lib/csrf";

const mockGetUser = vi.mocked(getCurrentUser);
const mockIsSameOrigin = vi.mocked(isSameOriginRequest);

const baseUser = {
  id: "u_s",
  name: "Student",
  email: "s@x.com",
  avatar: null,
  phone: null,
  bio: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const STUDENT = { ...baseUser, role: "STUDENT" as const };
const TEACHER = { ...baseUser, id: "u_t", role: "TEACHER" as const };
const ADMIN = { ...baseUser, id: "u_a", role: "ADMIN" as const };

function jsonRequest(body: unknown, init: RequestInit = {}): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify(body),
    ...init,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsSameOrigin.mockReturnValue(true);
  mockGetUser.mockResolvedValue(null);
});

// ─── Validation ──────────────────────────────────────────────────

describe("withApiHandler — validation", () => {
  const schema = z.object({ name: z.string().min(3) });

  it("passes validated body to the handler", async () => {
    const inner = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiHandler(inner, { schema });

    const res = await wrapped(jsonRequest({ name: "آلفا" }));
    expect(res.status).toBe(200);
    expect(inner).toHaveBeenCalledTimes(1);
    expect(inner.mock.calls[0]?.[0]?.body).toEqual({ name: "آلفا" });
  });

  it("returns 400 on malformed JSON", async () => {
    const inner = vi.fn();
    const wrapped = withApiHandler(inner, { schema });
    const res = await wrapped(
      new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: "{not json",
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("BAD_JSON");
    expect(inner).not.toHaveBeenCalled();
  });

  it("returns 422 with first zod issue on validation failure", async () => {
    const inner = vi.fn();
    const wrapped = withApiHandler(inner, { schema });
    const res = await wrapped(jsonRequest({ name: "a" }));
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.code).toBe("VALIDATION_ERROR");
    expect(data.error).toBeTruthy();
    expect(inner).not.toHaveBeenCalled();
  });

  it("includes issue list in dev mode", async () => {
    const prev = process.env.NODE_ENV;
    (process.env as { NODE_ENV?: string }).NODE_ENV = "development";
    try {
      const wrapped = withApiHandler(async () => NextResponse.json({}), { schema });
      const res = await wrapped(jsonRequest({ name: "a" }));
      const data = await res.json();
      expect(data.details?.issues).toBeDefined();
    } finally {
      (process.env as { NODE_ENV?: string }).NODE_ENV = prev;
    }
  });

  it("omits issue list in production", async () => {
    const prev = process.env.NODE_ENV;
    (process.env as { NODE_ENV?: string }).NODE_ENV = "production";
    try {
      const wrapped = withApiHandler(async () => NextResponse.json({}), { schema });
      const res = await wrapped(jsonRequest({ name: "a" }));
      const data = await res.json();
      expect(data.details).toBeUndefined();
    } finally {
      (process.env as { NODE_ENV?: string }).NODE_ENV = prev;
    }
  });
});

// ─── Auth & roles ────────────────────────────────────────────────

describe("withApiHandler — auth & roles", () => {
  it("returns 401 when no session and auth is required", async () => {
    mockGetUser.mockResolvedValue(null);
    const inner = vi.fn();
    const wrapped = withApiHandler(inner, { auth: {} });
    const res = await wrapped(jsonRequest({}));
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("UNAUTHENTICATED");
    expect(inner).not.toHaveBeenCalled();
  });

  it("returns 403 when role is not in the allow-list", async () => {
    mockGetUser.mockResolvedValue(STUDENT);
    const inner = vi.fn();
    const wrapped = withApiHandler(inner, { auth: { roles: ["TEACHER", "ADMIN"] } });
    const res = await wrapped(jsonRequest({}));
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("FORBIDDEN");
    expect(inner).not.toHaveBeenCalled();
  });

  it("passes when role matches", async () => {
    mockGetUser.mockResolvedValue(TEACHER);
    const inner = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiHandler(inner, { auth: { roles: ["TEACHER", "ADMIN"] } });
    const res = await wrapped(jsonRequest({}));
    expect(res.status).toBe(200);
    expect(inner.mock.calls[0]?.[0]?.user).toEqual(TEACHER);
  });

  it("passes any authenticated user when roles list is empty", async () => {
    mockGetUser.mockResolvedValue(STUDENT);
    const inner = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiHandler(inner, { auth: {} });
    const res = await wrapped(jsonRequest({}));
    expect(res.status).toBe(200);
  });
});

// ─── CSRF ───────────────────────────────────────────────────────

describe("withApiHandler — CSRF", () => {
  it("rejects when origin mismatches", async () => {
    mockIsSameOrigin.mockReturnValue(false);
    const inner = vi.fn();
    const wrapped = withApiHandler(inner, { csrf: true });
    const res = await wrapped(jsonRequest({}));
    expect(res.status).toBe(403);
    expect(inner).not.toHaveBeenCalled();
  });

  it("skips CSRF for GET requests", async () => {
    mockIsSameOrigin.mockReturnValue(false); // even if origin is wrong
    const inner = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiHandler(inner, { csrf: true });
    const res = await wrapped(
      new Request("http://localhost/api/test", { method: "GET" }),
    );
    expect(res.status).toBe(200);
  });
});

// ─── Correlation id ─────────────────────────────────────────────

describe("withApiHandler — correlation id", () => {
  it("echoes the correlation id in the response header", async () => {
    const wrapped = withApiHandler(async () => NextResponse.json({}));
    const res = await wrapped(jsonRequest({}));
    const id = res.headers.get("X-Correlation-Id");
    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("passes the same id to the inner handler", async () => {
    let captured = "";
    const wrapped = withApiHandler(async ({ correlationId }) => {
      captured = correlationId;
      return NextResponse.json({});
    });
    await wrapped(jsonRequest({}));
    expect(captured).toMatch(/^[0-9a-f-]{36}$/i);
  });
});

// ─── Error handling ─────────────────────────────────────────────

describe("withApiHandler — error handling", () => {
  it("returns 500 with correlation id when handler throws", async () => {
    const wrapped = withApiHandler(async () => {
      throw new Error("boom");
    });
    const res = await wrapped(jsonRequest({}));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.code).toBe("INTERNAL_ERROR");
    expect(data.correlationId).toBeTruthy();
  });
});
