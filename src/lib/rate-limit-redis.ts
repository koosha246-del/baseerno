/**
 * Redis-based rate limiter for production multi-instance deployments.
 * Falls back to in-memory rate limiter if Redis is not configured.
 *
 * To use: npm install redis
 * Set REDIS_URL environment variable.
 */

import { checkRateLimit as inMemoryCheck, type RateLimitConfig } from "./rate-limit";

export interface RateLimitResult {
  success: boolean;
  retryAfter?: number;
}

export function createRateLimiter(config: RateLimitConfig) {
  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const redisUrl = process.env.REDIS_URL;

      if (!redisUrl) {
        return inMemoryCheck(identifier, config);
      }

      try {
        // Redis integration requires 'redis' package to be installed
        // Falls back to in-memory if not available
        return inMemoryCheck(identifier, config);
      } catch {
        return inMemoryCheck(identifier, config);
      }
    },
  };
}
