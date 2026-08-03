import { describe, it, expect, beforeEach } from "vitest";
import {
  withRateLimit,
  applyRateLimitHeaders,
  rateLimitedResponse,
  isDbUnavailableError,
} from "../api-middleware";
import {
  clearAllRateLimits,
  RATE_LIMIT_PRESETS,
  checkRateLimit,
} from "../rate-limit";

beforeEach(() => {
  clearAllRateLimits();
});

function makeReq(ip = "9.9.9.9") {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({}),
  });
}

describe("applyRateLimitHeaders", () => {
  it("adds Limit / Remaining / Reset on success", () => {
    const result = checkRateLimit("hdr-ok", { windowMs: 60_000, max: 5 });
    expect(result.success).toBe(true);

    const res = applyRateLimitHeaders(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
      result,
      { max: 5, burst: 0 }
    );

    expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
    expect(res.headers.get("X-RateLimit-Remaining")).toBeDefined();
    expect(res.headers.get("X-RateLimit-Reset")).toMatch(/^\d+$/);
    expect(res.headers.get("Retry-After")).toBeNull();
  });

  it("sets Remaining=0 and Retry-After when blocked", () => {
    const blocked = { success: false as const, retryAfter: 42 };
    const res = rateLimitedResponse(blocked, { max: 5, burst: 2 });

    expect(res.status).toBe(429);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("7");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(res.headers.get("X-RateLimit-Reset")).toMatch(/^\d+$/);
  });
});

describe("isDbUnavailableError", () => {
  it("detects Prisma driver code ECONNREFUSED (code property, not message)", () => {
    const err = new Error("Invalid `prisma.user.findUnique()` invocation:") as Error & {
      code?: string;
    };
    err.code = "ECONNREFUSED";
    expect(isDbUnavailableError(err)).toBe(true);
  });

  it("detects P1001 / P1017 codes", () => {
    const p1001 = new Error("x") as Error & { code?: string };
    p1001.code = "P1001";
    expect(isDbUnavailableError(p1001)).toBe(true);
    const p1017 = new Error("y") as Error & { code?: string };
    p1017.code = "P1017";
    expect(isDbUnavailableError(p1017)).toBe(true);
  });

  it("detects raw pg errors via message text", () => {
    expect(isDbUnavailableError(new Error("connect ECONNREFUSED 127.0.0.1:5432"))).toBe(true);
    expect(
      isDbUnavailableError(new Error("Can't reach database server at `localhost:5432`"))
    ).toBe(true);
  });

  it("walks the cause chain for wrapped driver errors", () => {
    const inner = new Error("connect ECONNREFUSED") as Error & { code?: string };
    inner.code = "ECONNREFUSED";
    const outer = new Error("Invalid `prisma.course.findMany()` invocation:", { cause: inner });
    expect(isDbUnavailableError(outer)).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isDbUnavailableError(new Error("boom"))).toBe(false);
    expect(isDbUnavailableError(null)).toBe(false);
    expect(isDbUnavailableError("ECONNREFUSED")).toBe(false);
  });
});

describe("withRateLimit", () => {
  it("allows requests under the limit and attaches headers", async () => {
    const handler = withRateLimit(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      { windowMs: 60_000, max: 3, burst: 0 },
      { keyPrefix: "test:allow" }
    );

    const res = await handler(makeReq("1.1.1.1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("3");
    expect(Number(res.headers.get("X-RateLimit-Remaining"))).toBeLessThanOrEqual(2);
  });

  it("returns 429 after exhausting AUTH-like max without burst", async () => {
    const handler = withRateLimit(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      { windowMs: 60_000, max: 5, burst: 0 },
      { keyPrefix: "test:block5" }
    );

    const ip = "2.2.2.2";
    for (let i = 0; i < 5; i++) {
      const res = await handler(makeReq(ip));
      expect(res.status).toBe(200);
    }

    const sixth = await handler(makeReq(ip));
    expect(sixth.status).toBe(429);
    expect(sixth.headers.get("Retry-After")).toBeTruthy();
    expect(sixth.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("returns 503 DB_UNAVAILABLE when handler throws a DB-down error", async () => {
    const handler = withRateLimit(
      async () => {
        const err = new Error("Invalid `prisma.user.findUnique()` invocation:") as Error & {
          code?: string;
        };
        err.code = "ECONNREFUSED";
        throw err;
      },
      { windowMs: 60_000, max: 100, burst: 0 },
      { keyPrefix: "test:dbdown" }
    );

    const res = await handler(makeReq("5.5.5.5"));
    expect(res.status).toBe(503);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.code).toBe("DB_UNAVAILABLE");
    expect(String(body.error)).toContain("دیتابیس");
    expect(res.headers.get("x-request-id")).toBeTruthy();
  });

  it("keeps generic 500 for non-DB errors", async () => {
    const handler = withRateLimit(
      async () => {
        throw new Error("boom");
      },
      { windowMs: 60_000, max: 100, burst: 0 },
      { keyPrefix: "test:generic500" }
    );

    const res = await handler(makeReq("6.6.6.6"));
    expect(res.status).toBe(500);
  });

  it("AUTH preset enforces the burst sub-window as a hard cap", async () => {
    const handler = withRateLimit(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      RATE_LIMIT_PRESETS.AUTH,
      { keyPrefix: "test:auth-preset" }
    );

    const ip = "3.3.3.3";
    const burst = RATE_LIMIT_PRESETS.AUTH.burst;
    const total = RATE_LIMIT_PRESETS.AUTH.max + RATE_LIMIT_PRESETS.AUTH.burst;

    for (let i = 0; i < burst; i++) {
      const res = await handler(makeReq(ip));
      expect(res.status).toBe(200);
    }

    // The burst sub-window is a hard cap — the next request is 429
    // even though the combined max + burst window is far from full.
    const blocked = await handler(makeReq(ip));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("X-RateLimit-Limit")).toBe(String(total));
  });
});
