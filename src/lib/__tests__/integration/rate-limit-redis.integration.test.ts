/**
 * Integration tests proving the AUTH rate limit is SHARED across app
 * instances when a real Redis is configured.
 *
 * Two limiter instances simulate two app processes: each has its own
 * in-memory store, so the only way they can agree on a shared budget is
 * through Redis keys. This file proves:
 *
 *   1. Instance A exhausts the budget → instance B (fresh, empty memory)
 *      immediately sees the same budget as exhausted.
 *   2. The raw keys (`ratelimit:w:*` / `ratelimit:b:*`) hold real counts
 *      in Redis — the counter is not process-local.
 *   3. `reset()` clears the budget for every instance at once.
 *   4. Different identifiers are isolated (per-IP semantics).
 *   5. `checkRateLimitAsync` — the app's real entry point — writes Redis
 *      keys when `REDIS_URL` is set.
 *
 * These self-skip when REDIS_URL is absent (local dev without Redis) or
 * when Redis is unreachable; they run in CI where a redis service is
 * provisioned (see .github/workflows/ci.yml).
 *
 * ⚠️ Backend semantics are harmonized: both the Redis limiter and the
 * in-memory limiter (`rate-limit.ts`) implement the same burst contract —
 * no more than `burst` requests in any `burstWindowMs` sub-window,
 * counting every request. The AUTH preset therefore allows ~2 requests
 * per 10s burst window regardless of backend.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

/** How long we wait for a Redis handshake before giving up (clean skip). */
const PROBE_TIMEOUT_MS = 5_000;

/**
 * Probe Redis once at file load: skip the whole suite when there is no
 * REDIS_URL or the connection fails/times out. Top-level await keeps this
 * deterministic (no reliance on hook-side skips). The timeout guards
 * against a Redis that accepts TCP but never completes the RESP3
 * handshake (old Redis 5.x) — that would otherwise hang module import.
 */
const redisAvailable = await (async () => {
  if (!process.env.REDIS_URL) return false;
  try {
    const { getRedisClient } = await import("@/lib/redis-client");
    return (await Promise.race([
      getRedisClient(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), PROBE_TIMEOUT_MS)),
    ])) !== null;
  } catch {
    return false;
  }
})();

describe.skipIf(!redisAvailable)("rate-limit-redis (integration, real Redis)", () => {
  let createLimiter: typeof import("@/lib/rate-limit-redis").createRedisRateLimiter;
  let getClient: typeof import("@/lib/redis-client").getRedisClient;
  let closeRedis: typeof import("@/lib/redis-client").closeRedis;
  const usedIds: string[] = [];

  beforeAll(async () => {
    ({ createRedisRateLimiter: createLimiter } = await import("@/lib/rate-limit-redis"));
    ({ getRedisClient: getClient, closeRedis } = await import("@/lib/redis-client"));
  });

  afterAll(async () => {
    const client = await getClient();
    if (client) {
      for (const id of usedIds) {
        await client.del(`ratelimit:w:${id}`);
        await client.del(`ratelimit:b:${id}`);
      }
    }
    await closeRedis();
  });

  it("two instances share one AUTH budget via Redis", async () => {
    const id = `it-auth-shared-${Date.now()}`;
    usedIds.push(id);

    const instanceA = createLimiter(RATE_LIMIT_PRESETS.AUTH);
    const instanceB = createLimiter(RATE_LIMIT_PRESETS.AUTH);

    // Exhaust the AUTH budget through instance A. The burst sub-window
    // is a hard cap (≤ `burst` per 10s, counting every request), so at
    // most `burst` (2) requests are allowed before the next is blocked —
    // identical to the in-memory backend. The point here is the
    // *sharing*: a separate instance must see the same budget.
    let aAllowed = 0;
    for (let i = 0; i < 20; i++) {
      const r = await instanceA.check(id);
      if (!r.success) break;
      aAllowed++;
    }
    // Flake-proof: A must have been allowed at least once AND hit the
    // burst cap (≤ burst) — never more than the hard burst limit.
    expect(aAllowed).toBeGreaterThan(0);
    expect(aAllowed).toBeLessThanOrEqual(RATE_LIMIT_PRESETS.AUTH.burst);

    // Instance B — a *separate* limiter with an empty in-memory store —
    // must see the same budget as exhausted. Only possible if the counter
    // lives in Redis, not process memory.
    const bResult = await instanceB.check(id);
    expect(bResult.success).toBe(false);

    // A fresh identifier is still allowed on B (per-IP isolation).
    const freshId = `it-auth-fresh-${Date.now()}`;
    usedIds.push(freshId);
    expect((await instanceB.check(freshId)).success).toBe(true);
  });

  it("writes real Redis keys (not process-local) and reports combined-limit remaining", async () => {
    const id = `it-auth-keys-${Date.now()}`;
    usedIds.push(id);
    const limiter = createLimiter(RATE_LIMIT_PRESETS.AUTH);
    // AUTH combined limit = max(5) + burst(2) = 7. The `remaining` field
    // must be computed against the COMBINED limit (7 - count), not `max`
    // (5 - count) — that was the Redis-side bug this harmonization fixed.
    const combined = RATE_LIMIT_PRESETS.AUTH.max + RATE_LIMIT_PRESETS.AUTH.burst;

    const r1 = await limiter.check(id);
    expect(r1.success).toBe(true);
    if (r1.success) expect(r1.remaining).toBe(combined - 1);

    const r2 = await limiter.check(id);
    expect(r2.success).toBe(true);
    if (r2.success) expect(r2.remaining).toBe(combined - 2);

    const client = (await getClient())!;
    const windowCount = await client.get(`ratelimit:w:${id}`);
    const burstCount = await client.get(`ratelimit:b:${id}`);
    expect(Number(windowCount)).toBe(2);
    expect(Number(burstCount)).toBe(2);
  });

  it("reset() clears the shared budget for every instance", async () => {
    const id = `it-auth-reset-${Date.now()}`;
    usedIds.push(id);
    const cfg = { windowMs: 60_000, max: 3, burst: 0 } as const;
    const instanceA = createLimiter(cfg);
    const instanceB = createLimiter(cfg);

    for (let i = 0; i < 3; i++) {
      expect((await instanceA.check(id)).success).toBe(true);
    }
    expect((await instanceB.check(id)).success).toBe(false); // shared → exhausted

    await instanceA.reset(id);

    expect((await instanceB.check(id)).success).toBe(true); // B sees the reset
  });

  it("different identifiers are isolated (per-IP semantics)", async () => {
    const idA = `it-auth-iso-a-${Date.now()}`;
    const idB = `it-auth-iso-b-${Date.now()}`;
    usedIds.push(idA, idB);
    const cfg = { windowMs: 60_000, max: 1, burst: 0 } as const;
    const limiter = createLimiter(cfg);

    expect((await limiter.check(idA)).success).toBe(true);
    expect((await limiter.check(idA)).success).toBe(false); // exhausted
    expect((await limiter.check(idB)).success).toBe(true); // different key → allowed
  });

  it("checkRateLimitAsync (the app entry point) writes Redis keys when REDIS_URL is set", async () => {
    const { checkRateLimitAsync } = await import("@/lib/rate-limit-async");
    const id = `it-async-${Date.now()}`;
    usedIds.push(id);
    const cfg = { windowMs: 60_000, max: 2, burst: 0 } as const;

    expect((await checkRateLimitAsync(id, cfg)).success).toBe(true);
    expect((await checkRateLimitAsync(id, cfg)).success).toBe(true);
    expect((await checkRateLimitAsync(id, cfg)).success).toBe(false); // 3rd blocked

    const client = (await getClient())!;
    const count = await client.get(`ratelimit:w:${id}`);
    expect(Number(count)).toBe(3);
  });
});
