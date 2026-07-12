/**
 * Simple in-memory rate limiter.
 * Tracks request counts per IP within a sliding window.
 * Resets on server restart — fine for single-instance deployments.
 * For production at scale, swap with Upstash Ratelimit + Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically purge expired entries to prevent unbounded memory growth.
// Runs every 60s and removes entries whose window has passed.
const CLEANUP_INTERVAL_MS = 60_000;
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

export interface RateLimitConfig {
  /** Time window in milliseconds. */
  windowMs: number;
  /** Max requests allowed within the window. */
  max: number;
}

/**
 * Check if a request from the given identifier is within rate limits.
 * Returns { success: true } if allowed, { success: false, retryAfter } if limited.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60_000, max: 10 }
): { success: true } | { success: false; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { success: true };
  }

  if (entry.count >= config.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { success: false, retryAfter };
  }

  entry.count++;
  return { success: true };
}

/**
 * Extract a client identifier from the request (IP or forwarded-for).
 */
export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return "local";
}
