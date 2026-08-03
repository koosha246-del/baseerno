/**
 * Rate Limiter — In-memory sliding window implementation.
 *
 * Features:
 * - **Sliding window log** — more accurate than fixed-window counters.
 * - **Per-route configuration** — each route can define its own window & max.
 * - **Burst support** — allows short-term spikes up to `max + burst` total,
 *   but no more than `burst` requests within the `burstWindowMs` sub-window.
 * - **Adaptive cleanup** — expired entries are purged periodically.
 *
 * For production multi-instance deployments, pair with
 * `rate-limit-redis.ts` (or swap to Upstash Ratelimit).
 *
 * @example
 * ```ts
 * import { rateLimitMiddleware, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
 *
 * export async function POST(req: Request) {
 *   const limited = rateLimitMiddleware(req, RATE_LIMIT_PRESETS.AUTH);
 *   if (!limited.success) {
 *     return tooManyRequestsResponse(limited.retryAfter);
 *   }
 *   // ... handle request
 * }
 * ```
 */

// ─── Types ─────────────────────────────────────────────────────────

export interface RateLimitConfig {
  /** Time window in milliseconds. Default: 60_000 (1 minute). */
  windowMs?: number;
  /** Max requests allowed within the window. Default: 10. */
  max?: number;
  /**
   * Burst allowance — additional requests allowed on top of `max` within
   * a shorter `burstWindowMs`.  This allows short-term traffic spikes
   * without false positives.
   *
   * The combined limit is effectively `max + burst` per `windowMs`, but
   * no more than `burst` in any `burstWindowMs` sub-window.
   *
   * Default: 0 (no burst).
   */
  burst?: number;
  /**
   * Burst window in milliseconds. Default: 2_000 (2 seconds).
   * Only meaningful when `burst > 0`.
   */
  burstWindowMs?: number;
}

export type RateLimitResult =
  | { success: true; remaining: number; resetAt: number }
  | { success: false; retryAfter: number };

// ─── Internal state ────────────────────────────────────────────────

interface WindowEntry {
  /** Sorted timestamps (milliseconds) of requests within the window. */
  timestamps: number[];
  /** When the window started (approx). */
  windowStart: number;
}

/** Per-identifier state — single timestamp list, checked against two limits. */
const store = new Map<string, WindowEntry>();

// ─── Cleanup ───────────────────────────────────────────────────────

const CLEANUP_INTERVAL_MS = 30_000; // Every 30s

let cleanupHandle: ReturnType<typeof setInterval> | null = null;

function startCleanup(): void {
  if (cleanupHandle !== null) return;
  cleanupHandle = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      // Keep only timestamps within the last 2 minutes (max possible window).
      entry.timestamps = entry.timestamps.filter((t) => now - t < 120_000);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  // Allow the process to exit even if the timer is still pending.
  if (typeof cleanupHandle === "object" && "unref" in cleanupHandle) {
    cleanupHandle.unref();
  }
}

// ─── Presets (per-route defaults) ─────────────────────────────────

export const RATE_LIMIT_PRESETS = {
  /** Strict: auth endpoints (login, register, forgot-password). */
  AUTH: { windowMs: 60_000, max: 5, burst: 2, burstWindowMs: 10_000 } as const,
  /** Moderate: API mutations. */
  API: { windowMs: 60_000, max: 20, burst: 5, burstWindowMs: 5_000 } as const,
  /** Relaxed: read-heavy endpoints (search, listings). */
  READ: { windowMs: 60_000, max: 60, burst: 10, burstWindowMs: 2_000 } as const,
  /** Strictest: contact form, password reset. */
  SENSITIVE: { windowMs: 120_000, max: 3, burst: 1, burstWindowMs: 30_000 } as const,
} as const;

// ─── Core logic ────────────────────────────────────────────────────

function getConfig(config?: RateLimitConfig): Required<RateLimitConfig> {
  return {
    windowMs: config?.windowMs ?? 60_000,
    max: config?.max ?? 10,
    burst: config?.burst ?? 0,
    burstWindowMs: config?.burstWindowMs ?? 2_000,
  };
}

/**
 * Check if a request from the given identifier is within rate limits.
 *
 * Uses a **sliding window log** algorithm: we keep a sorted list of
 * timestamps for each identifier and remove entries older than the window.
 *
 * **Burst logic**: when `burst > 0`, the combined limit becomes
 * `max + burst` total requests per `windowMs`, and **every** request
 * counts toward a hard burst cap — no more than `burst` requests may
 * arrive within any `burstWindowMs` sub-window. This is the same
 * contract the Redis backend (`rate-limit-redis.ts`) implements, so
 * development and production behave identically.
 */
export function checkRateLimit(
  identifier: string,
  config?: RateLimitConfig
): RateLimitResult {
  const cfg = getConfig(config);
  const now = Date.now();

  // Ensure cleanup is running.
  startCleanup();

  let entry = store.get(identifier);

  if (!entry) {
    entry = { timestamps: [now], windowStart: now };
    store.set(identifier, entry);

    return {
      success: true,
      remaining: cfg.max + cfg.burst - 1,
      resetAt: now + cfg.windowMs,
    };
  }

  // Prune timestamps older than the main window.
  const cutoff = now - cfg.windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
  entry.windowStart = entry.timestamps[0] ?? now;

  const totalRequests = entry.timestamps.length;
  const combinedLimit = cfg.max + cfg.burst;

  // ── Hard limit: total combined requests ────────────────────────
  if (totalRequests >= combinedLimit) {
    const oldest = entry.timestamps[0]!;
    const retryAfter = Math.ceil((oldest + cfg.windowMs - now) / 1000);
    return { success: false, retryAfter: Math.max(1, retryAfter) };
  }

  // ── Burst sub-window check (hard cap — counts EVERY request) ────
  if (cfg.burst > 0) {
    const burstCutoff = now - cfg.burstWindowMs;
    // No more than `burst` requests may arrive within any
    // `burstWindowMs` sub-window. We check BEFORE recording this
    // request, so blocking when `recentTotal >= burst` guarantees the
    // window never holds more than `burst` entries — the exact
    // contract the Redis backend implements (burst = hard cap, not
    // "extra beyond max").
    const recentTotal = entry.timestamps.filter((t) => t > burstCutoff).length;

    if (recentTotal >= cfg.burst) {
      // Retry after the burst window expires.
      const retryAfter = Math.ceil(cfg.burstWindowMs / 1000);
      return { success: false, retryAfter: Math.max(1, retryAfter) };
    }
  }

  // ── Allow — record the request ────────────────────────────────
  entry.timestamps.push(now);

  return {
    success: true,
    remaining: combinedLimit - entry.timestamps.length,
    resetAt: now + cfg.windowMs,
  };
}

/**
 * Extract a client identifier from the incoming request.
 *
 * Priority:
 * 1. `x-forwarded-for` header (trusted proxy sets this).
 * 2. `x-real-ip` header.
 * 3. `cf-connecting-ip` (Cloudflare).
 * 4. Internal IP fallback.
 */
export function getClientIdentifier(req: Request | undefined): string {
  // Defensive: tests occasionally call the wrapped handler with no args
  // (or with a stub Request missing `headers`). Treat as a single shared
  // bucket ("anonymous") so the test still exercises the rate-limit
  // path without throwing on `undefined`.
  if (!req?.headers) return "anonymous";

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP in the chain (the actual client).
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  return "local";
}

/**
 * Convenience middleware — checks rate limit and returns a result.
 *
 * @example
 * ```ts
 * const result = rateLimitMiddleware(req, RATE_LIMIT_PRESETS.AUTH);
 * if (!result.success) {
 *   return tooManyRequestsResponse(result.retryAfter);
 * }
 * ```
 */
export function rateLimitMiddleware(
  req: Request,
  config?: RateLimitConfig
): RateLimitResult {
  const identifier = getClientIdentifier(req);
  return checkRateLimit(identifier, config);
}

/**
 * Build a standard 429 (Too Many Requests) response.
 * Includes `Retry-After` header and JSON body with Persian error message.
 */
export function tooManyRequestsResponse(retryAfter: number): Response {
  return Response.json(
    {
      error: "درخواست بیش از حد مجاز. لطفاً کمی صبر کنید.",
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "Content-Type": "application/json; charset=utf-8",
      },
    }
  );
}

/**
 * Reset rate limit state for a given identifier (useful in tests).
 */
export function resetRateLimit(identifier: string): void {
  store.delete(identifier);
}

/**
 * Clear all rate limit state (useful in tests or on config change).
 */
export function clearAllRateLimits(): void {
  store.clear();
}

/**
 * Get current store size for diagnostics.
 */
export function getRateLimitStoreSize(): number {
  return store.size;
}
