/**
 * Redis-based rate limiter — for production multi-instance deployments.
 *
 * Uses the shared Redis client from `@/lib/redis-client` so only one
 * connection is used across the whole application.
 *
 * Implements the same contract as the in-memory limiter (`rate-limit.ts`):
 * no more than `max + burst` requests per `windowMs`, and no more than
 * `burst` requests within any `burstWindowMs` sub-window (counting every
 * request). Falls back to in-memory rate limiting when Redis is
 * unavailable.
 */

import { checkRateLimit as inMemoryCheck, type RateLimitConfig, type RateLimitResult } from "./rate-limit";
import { getRedisClient } from "./redis-client";

// ─── Redis key helpers ─────────────────────────────────────────────

function buildWindowKey(identifier: string): string {
  return `ratelimit:w:${identifier}`;
}

function buildBurstKey(identifier: string): string {
  return `ratelimit:b:${identifier}`;
}

// ─── Rate limiter factory ──────────────────────────────────────────

export interface RateLimiterInstance {
  check: (identifier: string) => Promise<RateLimitResult>;
  reset: (identifier: string) => Promise<void>;
  shutdown: () => Promise<void>;
}

/**
 * Create a rate limiter instance with the given configuration.
 *
 * The returned instance automatically selects Redis or in-memory
 * backend based on the environment configuration.
 */
export function createRedisRateLimiter(config: RateLimitConfig): RateLimiterInstance {
  const cfg = {
    windowMs: config.windowMs ?? 60_000,
    max: config.max ?? 10,
    burst: config.burst ?? 0,
    burstWindowMs: config.burstWindowMs ?? 2_000,
  };

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const client = await getRedisClient();
      if (!client) {
        return inMemoryCheck(identifier, cfg);
      }

      try {
        const now = Date.now();
        const windowKey = buildWindowKey(identifier);
        const windowSeconds = Math.ceil(cfg.windowMs / 1000);

        const count = await client.incr(windowKey);
        if (count === 1) {
          await client.expire(windowKey, windowSeconds);
        }

        const ttl = await client.ttl(windowKey);
        const resetAt = now + Math.max(ttl, 1) * 1000;

        // Combined limit — the documented contract is `max + burst`
        // total requests per window (same as the in-memory backend).
        const combinedLimit = cfg.max + cfg.burst;

        if (count > combinedLimit) {
          const retryAfter = Math.max(1, ttl);
          return { success: false, retryAfter };
        }

        // ── Burst check (Redis-backed, hard cap) ────────────────
        // Every request counts: no more than `burst` requests within
        // any `burstWindowMs` sub-window — identical to the in-memory
        // limiter's burst semantics.
        if (cfg.burst > 0) {
          const burstKey = buildBurstKey(identifier);
          const burstSeconds = Math.ceil(cfg.burstWindowMs / 1000);
          const burstCount = await client.incr(burstKey);
          if (burstCount === 1) {
            await client.expire(burstKey, burstSeconds);
          }
          if (burstCount > cfg.burst) {
            const burstTtl = await client.ttl(burstKey);
            const retryAfter = Math.max(1, burstTtl);
            return { success: false, retryAfter };
          }
        }

        return {
          success: true,
          remaining: combinedLimit - count,
          resetAt,
        };
      } catch (error) {
        console.warn("[redis-rate-limiter] Request failed, falling back to in-memory:", error);
        return inMemoryCheck(identifier, cfg);
      }
    },

    async reset(identifier: string): Promise<void> {
      const client = await getRedisClient();
      if (!client) {
        const { resetRateLimit } = await import("./rate-limit");
        resetRateLimit(identifier);
        return;
      }

      try {
        await client.set(buildWindowKey(identifier), 0, { EX: 1 });
        if (cfg.burst > 0) {
          await client.set(buildBurstKey(identifier), 0, { EX: 1 });
        }
      } catch {
        // Best-effort
      }
    },

    async shutdown(): Promise<void> {
      const { closeRedis } = await import("./redis-client");
      await closeRedis();
    },
  };
}

/** Default rate limiter instance (auth preset). */
export const defaultRateLimiter = createRedisRateLimiter({
  windowMs: 60_000,
  max: 10,
  burst: 3,
  burstWindowMs: 5_000,
});
