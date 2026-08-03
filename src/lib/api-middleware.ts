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
import { setRequestId } from "@/lib/log";
import { incr } from "@/lib/metrics";
import { recordSloRequest, sloGroupOf } from "@/lib/slo";
import { env } from "@/lib/env";

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
 * Heuristic: is this thrown error a database-unreachable failure?
 *
 * Prisma surfaces these as `ECONNREFUSED` / `P1001` / "Can't reach database
 * server" when Postgres is down or the connection string is wrong. We
 * detect them so the API can answer with a meaningful 503 ("database not
 * available") instead of a generic 500 that leaves clients — and humans —
 * guessing.
 */
export function isDbUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // Prisma driver errors carry the driver code on `error.code` (e.g.
  // ECONNREFUSED / P1001), NOT in the message text — the message is just
  // the invocation header. Check code first.
  const code = (error as { code?: string }).code;
  if (
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "P1001" ||
    code === "P1017" // server has closed the connection
  ) {
    return true;
  }

  // Fall back to message heuristics (raw pg errors surface the code in text).
  const msg = error.message;
  if (
    msg.includes("ECONNREFUSED") ||
    msg.includes("Can't reach database server") ||
    msg.includes("P1001") ||
    msg.includes("connect ETIMEDOUT") ||
    msg.includes("server has closed the connection")
  ) {
    return true;
  }

  // Walk the cause chain (Prisma wraps the underlying driver error).
  // isDbUnavailableError already recurses down the chain, so a single
  // call covers every level (and returns false for non-Error input).
  return isDbUnavailableError(error.cause);
}

/**
 * Convert a thrown error into a JSON 500 response.
 *
 * Logs the real error server-side (with the request path when available);
 * in development the message is also returned as `detail` so the terminal
 * isn't required to debug. Production keeps the generic Persian message
 * (no internals leaked).
 */
export function handleApiError(
  error: unknown,
  correlationId?: string,
  context?: { req?: Request; userId?: string }
): Response {
  const path = context?.req ? new URL(context.req.url).pathname : "(unknown)";
  console.error(`[api] ${path} failed${correlationId ? ` (${correlationId})` : ""}:`, error);
  if (isDbUnavailableError(error)) {
    const response = Response.json(
      {
        error: "دیتابیس در دسترس نیست. مطمئن شوید PostgreSQL روشن است.",
        code: "DB_UNAVAILABLE",
        ...(correlationId ? { correlationId } : {}),
        ...(env.isDevelopment && error instanceof Error ? { detail: error.message } : {}),
      },
      { status: 503, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
    if (correlationId) {
      response.headers.set("x-request-id", correlationId);
    }
    return response;
  }
  const body: Record<string, unknown> = {
    error: "خطای داخلی سرور. لطفاً دوباره تلاش کنید.",
    code: "INTERNAL_ERROR",
  };
  if (correlationId) {
    body.correlationId = correlationId;
  }
  if (env.isDevelopment && error instanceof Error) {
    body.detail = error.message;
  }
  const response = Response.json(body, {
    status: 500,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
  if (correlationId) {
    response.headers.set("x-request-id", correlationId);
  }
  return response;
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

    // Structured-logging context: carry the request id through the
    // handler so every log line in the request is correlated.
    const requestId =
      req.headers.get("x-request-id") ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    setRequestId(requestId);

    const startedAt = Date.now();
    let response: Response;
    try {
      response = await handler(req, context);
    } catch (error) {
      // Never let a thrown handler bubble up as an HTML 500 — clients that
      // call `res.json()` (login form, AI chat, …) would throw instead of
      // showing the Persian message, leaving buttons stuck in "loading".
      console.error(
        `[api] ${req.method} ${new URL(req.url).pathname} failed:`,
        error
      );
      // Record the failure in the SLO bucket + error counter so thrown
      // 500s are visible on the Ops dashboard like any other 5xx.
      recordSloRequest(
        sloGroupOf(new URL(req.url).pathname),
        false,
        Date.now() - startedAt
      );
      incr("api:error");
      // Dev/debug: surface the real reason in the response body so the
      // terminal isn't required to see why a handler failed. Production
      // keeps the generic Persian message (no internals leaked).
      const dbDown = isDbUnavailableError(error);
      const body: Record<string, unknown> = dbDown
        ? {
            error: "دیتابیس در دسترس نیست. مطمئن شوید PostgreSQL روشن است.",
            code: "DB_UNAVAILABLE",
          }
        : {
            error: "خطای داخلی سرور. لطفاً دوباره تلاش کنید.",
          };
      if (env.isDevelopment && error instanceof Error) {
        body.detail = error.message;
      }
      const response = Response.json(body, {
        status: dbDown ? 503 : 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
      response.headers.set("x-request-id", requestId);
      setRequestId(undefined);
      return response;
    }
    // Ops signals: per-5-min SLO bucket (volume/errors/latency) + the
    // 5xx error counter. ok = status < 500 → 5xx drives the error rate.
    const ok = response.status < 500;
    recordSloRequest(sloGroupOf(new URL(req.url).pathname), ok, Date.now() - startedAt);
    if (!ok) incr("api:error");
    const withHeaders = applyRateLimitHeaders(response, result, preset);
    withHeaders.headers.set("x-request-id", requestId);
    setRequestId(undefined);
    return withHeaders;
  };
}
