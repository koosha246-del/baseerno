import { describe, it, expect, beforeEach } from "vitest";
import {
  withRateLimit,
  applyRateLimitHeaders,
  rateLimitedResponse,
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

  it("AUTH preset allows max+burst then blocks", async () => {
    const handler = withRateLimit(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      RATE_LIMIT_PRESETS.AUTH,
      { keyPrefix: "test:auth-preset" }
    );

    const ip = "3.3.3.3";
    const total = RATE_LIMIT_PRESETS.AUTH.max + RATE_LIMIT_PRESETS.AUTH.burst;

    for (let i = 0; i < total; i++) {
      const res = await handler(makeReq(ip));
      expect(res.status).toBe(200);
    }

    const blocked = await handler(makeReq(ip));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("X-RateLimit-Limit")).toBe(String(total));
  });
});
