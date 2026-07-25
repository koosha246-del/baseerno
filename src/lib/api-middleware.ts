/**
 * API route middleware helpers — rate limiting wrappers for Next.js handlers.
 *
 * Usage:
 * ```ts
 * import { withRateLimit } from "@/lib/api-middleware";
 * import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
 *
 * export const POST = withRateLimit(async (req) => {
 *   // ... handler body
 *   return NextResponse.json({ ok: true });
 * }, RATE_LIMIT_PRESETS.AUTH, { keyPrefix: "auth:login" });
 * ```
 */

import {
  getClientIdentifier,
  tooManyRequestsResponse,
  type RateLimitConfig,
  type RateLimitResult,
} from "@/lib/rate-limit";
import { checkRateLimitAsync } from "@/lib/rate-limit-async";

// ─── Types ─────────────────────────────────────────────────────────

/** Next.js App Router route handler shape (optional second `context` arg). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiRouteHandler = (req: Request, context?: any) => Promise<Response> | Response;

export interface WithRateLimitOptions {
  /**
   * Prefix for the rate-limit key (e.g. `auth:login`).
   * Final key: `{keyPrefix}:{clientId}` or just `clientId` when omitted.
   */
  keyPrefix?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

function resolveLimit(config?: RateLimitConfig): number {
  const max = config?.max ?? 10;
  const burst = config?.burst ?? 0;
  return max + burst;
}

function resetUnixSeconds(result: RateLimitResult): number {
  if (result.success) {
    return Math.ceil(result.resetAt / 1000);
  }
  return Math.ceil((Date.now() + result.retryAfter * 1000) / 1000);
}

/**
 * Attach standard rate-limit headers to an existing response.
 *
 * Headers:
 * - `X-RateLimit-Limit`
 * - `X-RateLimit-Remaining`
 * - `X-RateLimit-Reset` (unix epoch seconds)
 * - `Retry-After` (only when blocked)
 */
export function applyRateLimitHeaders(
  response: Response,
  result: RateLimitResult,
  config?: RateLimitConfig
): Response {
  const headers = new Headers(response.headers);
  const limit = resolveLimit(config);

  headers.set("X-RateLimit-Limit", String(limit));
  headers.set(
    "X-RateLimit-Remaining",
    result.success ? String(Math.max(0, result.remaining)) : "0"
  );
  headers.set("X-RateLimit-Reset", String(resetUnixSeconds(result)));

  if (!result.success) {
    headers.set("Retry-After", String(result.retryAfter));
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Build a 429 response with full rate-limit headers.
 */
export function rateLimitedResponse(
  result: Extract<RateLimitResult, { success: false }>,
  config?: RateLimitConfig
): Response {
  const base = tooManyRequestsResponse(result.retryAfter);
  return applyRateLimitHeaders(base, result, config);
}

/**
 * Wrap an API route handler with sliding-window (+ burst) rate limiting.
 *
 * Uses Redis when `REDIS_URL` is set (multi-instance production), otherwise
 * the in-memory limiter. On success, rate-limit headers are merged into the
 * handler response. On block, returns 429 with `Retry-After`.
 */
export function withRateLimit(
  handler: ApiRouteHandler,
  preset: RateLimitConfig,
  options?: WithRateLimitOptions
): ApiRouteHandler {
  return async (req: Request, context?: unknown) => {
    const clientId = getClientIdentifier(req);
    const key = options?.keyPrefix ? `${options.keyPrefix}:${clientId}` : clientId;
    const result = await checkRateLimitAsync(key, preset);

    if (!result.success) {
      return rateLimitedResponse(result, preset);
    }

    const response = await handler(req, context);
    return applyRateLimitHeaders(response, result, preset);
  };
}
