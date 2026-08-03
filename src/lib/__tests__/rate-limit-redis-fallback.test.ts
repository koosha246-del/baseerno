/**
 * Unit tests proving the rate limiter falls back to the in-memory sliding
 * window whenever Redis is unavailable:
 *
 *   1. `createRedisRateLimiter` falls back when `getRedisClient()` → null
 *      (no REDIS_URL or unreachable Redis).
 *   2. A Redis error mid-request (e.g. connection reset during `incr`)
 *      falls back without throwing.
 *   3. `checkRateLimitAsync` uses the in-memory store when REDIS_URL is
 *      unset — it never even attempts a Redis client.
 *   4. In-memory AUTH semantics match the direct `checkRateLimit` store
 *      (both backends implement the same hard-cap burst contract, so
 *      development and production behave identically).
 *
 * Everything here is mocked — no real Redis needed. `@/lib/env` is also
 * mocked with `REDIS_URL: undefined` so the suite is deterministic even
 * when CI exports REDIS_URL at the job level (see .github/workflows/ci.yml).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { redisClientMock } = vi.hoisted(() => ({ redisClientMock: vi.fn() }));

vi.mock("@/lib/redis-client", () => ({
  getRedisClient: redisClientMock,
  closeRedis: vi.fn(async () => {}),
}));

// Force the "no Redis configured" branch inside checkRateLimitAsync
// regardless of the ambient process.env.REDIS_URL (CI sets it).
vi.mock("@/lib/env", () => ({
  env: { REDIS_URL: undefined },
}));

import { createRedisRateLimiter } from "@/lib/rate-limit-redis";
import { checkRateLimitAsync, clearRateLimitAsyncCache } from "@/lib/rate-limit-async";
import { clearAllRateLimits, checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

beforeEach(() => {
  redisClientMock.mockReset();
  clearAllRateLimits();
  clearRateLimitAsyncCache();
});

describe("in-memory fallback (no Redis)", () => {
  it("createRedisRateLimiter falls back to in-memory when Redis is unreachable", async () => {
    redisClientMock.mockResolvedValue(null);
    const limiter = createRedisRateLimiter({ windowMs: 60_000, max: 3, burst: 0 });

    for (let i = 0; i < 3; i++) {
      expect((await limiter.check("mem-fallback")).success).toBe(true);
    }
    const blocked = await limiter.check("mem-fallback");
    expect(blocked.success).toBe(false);

    expect(redisClientMock).toHaveBeenCalled(); // it did try Redis first
  });

  it("falls back to in-memory even when Redis errors mid-request", async () => {
    const brokenClient = {
      incr: vi.fn().mockRejectedValue(new Error("connection reset")),
    };
    redisClientMock.mockResolvedValue(brokenClient);

    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const limiter = createRedisRateLimiter({ windowMs: 60_000, max: 1, burst: 0 });
      // Should NOT throw — the error is caught and the request is served
      // from the in-memory store.
      const r = await limiter.check("mem-broken");
      expect(r.success).toBe(true);
    } finally {
      warn.mockRestore();
    }
  });

  it("checkRateLimitAsync uses in-memory when REDIS_URL is unset (never touches Redis)", async () => {
    // @/lib/env is mocked with REDIS_URL undefined, so getLimiter() picks
    // the in-memory path and getRedisClient() must never be called.
    for (let i = 0; i < 3; i++) {
      expect(
        (await checkRateLimitAsync("async-mem", { windowMs: 60_000, max: 3 })).success
      ).toBe(true);
    }
    expect(
      (await checkRateLimitAsync("async-mem", { windowMs: 60_000, max: 3 })).success
    ).toBe(false);

    expect(redisClientMock).not.toHaveBeenCalled();
  });

  it("in-memory AUTH semantics match the plain checkRateLimit store (burst = hard cap)", async () => {
    // Explicit null client so the fallback path is visibly exercised
    // (not relying on mockReset() returning undefined by accident).
    redisClientMock.mockResolvedValue(null);
    const limiter = createRedisRateLimiter(RATE_LIMIT_PRESETS.AUTH);
    const id = "auth-mem";
    const burst = RATE_LIMIT_PRESETS.AUTH.burst;

    // Through the Redis limiter's in-memory fallback: exactly `burst`
    // (2) requests pass, the next is blocked by the hard burst cap.
    for (let i = 0; i < burst; i++) {
      expect((await limiter.check(id)).success).toBe(true);
    }
    expect((await limiter.check(id)).success).toBe(false);

    // The plain in-memory store agrees on the exact same contract.
    clearAllRateLimits();
    for (let i = 0; i < burst; i++) {
      expect(checkRateLimit(id, RATE_LIMIT_PRESETS.AUTH).success).toBe(true);
    }
    expect(checkRateLimit(id, RATE_LIMIT_PRESETS.AUTH).success).toBe(false);
  });
});
