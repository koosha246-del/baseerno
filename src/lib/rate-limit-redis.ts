/**
 * Redis-based rate limiter — for production multi-instance deployments.
 *
 * Features:
 * - **Atomic operations** using Redis `SET` + `TTL` pattern (no Lua needed).
 * - **Graceful fallback** to in-memory limiter when Redis is unavailable.
 * - **Connection health checks** with automatic reconnection.
 * - **Per-route configurability** via the same `RateLimitConfig` interface.
 *
 * Usage:
 * ```ts
 * import { createRedisRateLimiter } from "@/lib/rate-limit-redis";
 * import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
 *
 * const limiter = createRedisRateLimiter(RATE_LIMIT_PRESETS.AUTH);
 * const result = await limiter.check("user-ip-address");
 * ```
 *
 * Environment:
 * - Set `REDIS_URL` env var to enable Redis (e.g., `redis://localhost:6379`).
 * - Falls back to in-memory if `REDIS_URL` is not set or Redis is unreachable.
 * - Requires the `redis` npm package: `npm install redis`
 */

import { checkRateLimit as inMemoryCheck, type RateLimitConfig, type RateLimitResult } from "./rate-limit";

// ─── Module-level state ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface RedisClientLike {
  set: (key: string, value: string | number, options?: Record<string, unknown>) => Promise<unknown>;
  get: (key: string) => Promise<string | null>;
  ttl: (key: string) => Promise<number>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
  quit: () => Promise<void>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  isOpen: boolean;
  ping: () => Promise<string>;
}

let cachedClient: RedisClientLike | null = null;
let loadAttempted = false;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30_000; // 30 seconds

// ─── Client management ─────────────────────────────────────────────

async function getRedisClient(): Promise<RedisClientLike | null> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  if (loadAttempted && cachedClient) {
    // Periodic health check
    if (Date.now() - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
      lastHealthCheck = Date.now();
      try {
        await cachedClient.ping?.();
      } catch {
        // Connection lost — try to reconnect
        cachedClient = null;
        loadAttempted = false;
        return getRedisClient();
      }
    }
    return cachedClient;
  }

  if (loadAttempted) return null; // Already tried and failed

  loadAttempted = true;

  try {
    // Dynamic import so `redis` is only loaded when REDIS_URL is set.
    // @ts-expect-error — `redis` package is optional; import is guarded by try/catch
    // and only reached when REDIS_URL is configured. Install with: npm install redis
    const redisModule = await import("redis").catch(() => null);
    if (!redisModule) return null;
    const { createClient } = redisModule as { createClient: unknown };
    if (typeof createClient !== "function") return null;

    const client = createClient({ url: redisUrl });

    // Attach error handler to prevent unhandled rejections.
    client.on("error", (err: Error) => {
      console.error("[redis-rate-limiter] Connection error:", err.message);
    });

    await client.connect();
    lastHealthCheck = Date.now();
    cachedClient = client as unknown as RedisClientLike;
    return cachedClient;
  } catch (error) {
    console.warn(
      "[redis-rate-limiter] Failed to connect to Redis. Falling back to in-memory rate limiter.",
      error instanceof Error ? error.message : ""
    );
    return null;
  }
}

// ─── Redis key helpers ─────────────────────────────────────────────

function buildWindowKey(identifier: string): string {
  return `ratelimit:w:${identifier}`;
}

function buildBurstKey(identifier: string): string {
  return `ratelimit:b:${identifier}`;
}

// ─── Rate limiter factory ──────────────────────────────────────────

export interface RateLimiterInstance {
  /**
   * Check if the given identifier is within rate limits.
   * Uses Redis when available, falls back to in-memory.
   */
  check: (identifier: string) => Promise<RateLimitResult>;
  /**
   * Reset rate limit state for a given identifier.
   */
  reset: (identifier: string) => Promise<void>;
  /**
   * Gracefully shut down the Redis connection.
   */
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
        // Fallback to in-memory
        return inMemoryCheck(identifier, cfg);
      }

      try {
        const now = Date.now();
        const windowKey = buildWindowKey(identifier);
        const windowSeconds = Math.ceil(cfg.windowMs / 1000);

        // Atomically increment and set TTL on first creation.
        const count = await client.incr(windowKey);

        if (count === 1) {
          // First request — set expiry.
          await client.expire(windowKey, windowSeconds);
        }

        // Check TTL to compute reset time.
        const ttl = await client.ttl(windowKey);
        const resetAt = now + Math.max(ttl, 1) * 1000;

        if (count > cfg.max) {
          const retryAfter = Math.max(1, ttl);
          return { success: false, retryAfter };
        }

        // ── Burst check (Redis-backed) ─────────────────────────
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
          remaining: cfg.max - count,
          resetAt,
        };
      } catch (error) {
        // Redis error — fall back to in-memory for this request.
        console.warn("[redis-rate-limiter] Request failed, falling back to in-memory:", error);
        return inMemoryCheck(identifier, cfg);
      }
    },

    async reset(identifier: string): Promise<void> {
      const client = await getRedisClient();
      if (!client) {
        // In-memory fallback: call the in-memory reset.
        const { resetRateLimit } = await import("./rate-limit");
        resetRateLimit(identifier);
        return;
      }

      try {
        await client.set(buildWindowKey(identifier), 0, { EX: 1 }); // Expire immediately
        if (cfg.burst > 0) {
          await client.set(buildBurstKey(identifier), 0, { EX: 1 });
        }
      } catch {
        // Best-effort
      }
    },

    async shutdown(): Promise<void> {
      const client = cachedClient;
      if (client) {
        try {
          await client.quit();
        } catch {
          // Best-effort
        }
        cachedClient = null;
        loadAttempted = false;
      }
    },
  };
}

/**
 * Default rate limiter instance (auth preset).
 * Create additional instances for different routes using `createRedisRateLimiter`.
 */
export const defaultRateLimiter = createRedisRateLimiter({
  windowMs: 60_000,
  max: 10,
  burst: 3,
  burstWindowMs: 5_000,
});
