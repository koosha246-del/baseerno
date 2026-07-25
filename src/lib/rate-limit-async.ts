/**
 * Async rate-limit entry point used by API middleware.
 *
 * - With `REDIS_URL`: shared Redis counters across all app instances.
 * - Without Redis (or on Redis failure): in-memory sliding window.
 *
 * Limiter instances are cached per config fingerprint so we don't open a
 * new Redis connection strategy per request.
 */

import {
  checkRateLimit,
  type RateLimitConfig,
  type RateLimitResult,
} from "@/lib/rate-limit";
import { env } from "@/lib/env";

type Limiter = {
  check: (identifier: string) => Promise<RateLimitResult>;
};

const limiterCache = new Map<string, Limiter>();

function configKey(config?: RateLimitConfig): string {
  return [
    config?.windowMs ?? 60_000,
    config?.max ?? 10,
    config?.burst ?? 0,
    config?.burstWindowMs ?? 2_000,
  ].join(":");
}

async function getLimiter(config?: RateLimitConfig): Promise<Limiter> {
  const key = configKey(config);
  const cached = limiterCache.get(key);
  if (cached) return cached;

  if (!env.REDIS_URL) {
    const memory: Limiter = {
      check: async (id) => checkRateLimit(id, config),
    };
    limiterCache.set(key, memory);
    return memory;
  }

  const { createRedisRateLimiter } = await import("@/lib/rate-limit-redis");
  const redisLimiter = createRedisRateLimiter(config ?? {});
  limiterCache.set(key, redisLimiter);
  return redisLimiter;
}

/**
 * Check rate limit for `identifier` using Redis when available.
 */
export async function checkRateLimitAsync(
  identifier: string,
  config?: RateLimitConfig,
): Promise<RateLimitResult> {
  const limiter = await getLimiter(config);
  return limiter.check(identifier);
}

/** Test helper — drop cached limiters (e.g. after env change). */
export function clearRateLimitAsyncCache(): void {
  limiterCache.clear();
}
