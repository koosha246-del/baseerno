/**
 * Central API route composer.
 *
 * One composable wrapper that takes care of the cross-cutting concerns
 * every API route needs:
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  order │ concern       │ what it does                          │
 *   ├────────┼───────────────┼───────────────────────────────────────┤
 *   │   1    │ rate-limit    │ sliding window + burst (Redis or mem) │
 *   │   2    │ csrf          │ same-origin check for state-changing  │
 *   │   3    │ correlation   │ assigns X-Correlation-Id per request  │
 *   │   4    │ auth          │ resolves session → throws 401 if none │
 *   │   5    │ role          │ enforces role allow-list (403)        │
 *   │   6    │ json body     │ parses JSON body or returns 400       │
 *   │   7    │ zod validate  │ validates `body` against the schema   │
 *   │   8    │ user handler  │ your logic, typed & ergonomic         │
 *   │   9    │ error wrap    │ catches & logs unexpected errors      │
 *   └────────┴───────────────┴───────────────────────────────────────┘
 *
 * Usage:
 * ```ts
 * import { z } from "zod";
 * import { withApiHandler } from "@/lib/api/composer";
 * import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
 *
 * const schema = z.object({ name: z.string().min(3) });
 *
 * export const POST = withApiHandler(
 *   async ({ user, body }) => {
 *     // user is guaranteed to be a TEACHER here, body is validated.
 *     const created = await repository.createThing({ ...body, ownerId: user.id });
 *     return NextResponse.json({ created }, { status: 201 });
 *   },
 *   {
 *     schema,
 *     auth: { roles: ["TEACHER", "ADMIN"] },
 *     csrf: true,
 *     rateLimit: RATE_LIMIT_PRESETS.API,
 *     rateLimitKey: "things:create",
 *   }
 * );
 * ```
 *
 * What you no longer have to write in every route:
 * - `crypto.randomUUID()` boilerplate
 * - `try { body = await req.json() } catch { return 400 }`
 * - CSRF origin check
 * - zod safeParse + 422 response formatting
 * - `getCurrentUser()` + 401/403 returns
 * - rate-limit wrapper
 * - try/catch + handleApiError at the bottom
 *
 * The shape is intentionally narrow so it stays compatible with Next.js
 * App Router route exports (`export const GET/POST/PUT/PATCH/DELETE`).
 */

import { NextResponse } from "next/server";
import { z, type ZodTypeAny } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import type { SafeUser } from "@/lib/db/types";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit, handleApiError, type ApiRouteHandler } from "@/lib/api-middleware";
import { type RateLimitConfig } from "@/lib/rate-limit";

// ─── Public types ─────────────────────────────────────────────────

/** Roles available in the بصیر نو platform. Kept narrow so `auth.roles`
 *  fails typecheck if a typo slips through. */
export type Role = "STUDENT" | "TEACHER" | "ADMIN";

export interface ComposerContext<TBody> {
  /** Validated request body (or `null` for GET/DELETE without a body). */
  body: TBody;
  /** Resolved session user — guaranteed to be present when `auth` is set. */
  user: SafeUser;
  /** Correlation id assigned to this request (also exposed in response header). */
  correlationId: string;
  /** Raw Request object — for cases that need it (e.g. headers, cookies). */
  req: Request;
}

export interface ComposerOptions<TSchema extends ZodTypeAny | undefined> {
  /** Zod schema for the JSON request body. Skip for GET / DELETE without body. */
  schema?: TSchema;
  /** When set, the route requires an authenticated session. */
  auth?: {
    /** Optional role allow-list. If absent, any authenticated user passes. */
    roles?: readonly Role[];
  };
  /** Enforce same-origin check (recommended for every mutating route). */
  csrf?: boolean;
  /** Rate-limit preset + key prefix. Omit to disable rate limiting. */
  rateLimit?: RateLimitConfig;
  rateLimitKey?: string;
  /** Optional runtime hint (Node.js vs Edge). Defaults to "nodejs". */
  runtime?: "nodejs" | "edge";
}

// ─── Helpers ──────────────────────────────────────────────────────

/** Translates a Zod issue into a short, Persian-friendly message. */
function firstZodMessage(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return "ورودی نامعتبر.";
  return first.message || "ورودی نامعتبر.";
}

/** Builds the 401 / 403 / 422 / 400 JSON responses consistently. */
function jsonError(
  message: string,
  status: number,
  correlationId: string,
  code: string,
  details?: unknown,
): Response {
  return NextResponse.json(
    {
      error: message,
      code,
      correlationId,
      ...(details ? { details } : {}),
    },
    {
      status,
      headers: { "X-Correlation-Id": correlationId },
    },
  );
}

// ─── The composer ─────────────────────────────────────────────────

/**
 * Wraps a Next.js App Router route handler with auth, role, CSRF, JSON
 * body parsing, zod validation, rate limiting, correlation id, and
 * error handling — in that order.
 *
 * The inner handler is called only when every prior guard passes.
 * Failures are short-circuited as JSON 4xx responses.
 */
export function withApiHandler<TSchema extends ZodTypeAny | undefined>(
  // The inner handler sees the validated body. We type it as `unknown` at
  // the boundary and narrow inside the wrapper so the call signature is
  // type-safe at the call site.
  handler: (ctx: ComposerContext<z.infer<NonNullable<TSchema>> | null>) => Promise<Response>,
  options: ComposerOptions<TSchema> = {},
): ApiRouteHandler {
  const { schema, auth, csrf, rateLimit, rateLimitKey } = options;

  const wrapped: ApiRouteHandler = async (req: Request, context?: unknown) => {
    const correlationId = crypto.randomUUID();
    const accept = req.headers.get("accept") ?? "";
    const wantsJson = accept.includes("application/json") || accept === "*/*";

    // 1. CSRF — only for non-GET methods (mutations only)
    if (csrf && req.method !== "GET" && req.method !== "HEAD") {
      if (!isSameOriginRequest(req)) {
        return csrfRejectedResponse();
      }
    }

    // 2. Auth — resolve session up-front so the handler can rely on it.
    let user: SafeUser | null = null;
    if (auth) {
      user = await getCurrentUser();
      if (!user) {
        return jsonError("احراز هویت نشده.", 401, correlationId, "UNAUTHENTICATED");
      }

      if (auth.roles && auth.roles.length > 0 && !auth.roles.includes(user.role as Role)) {
        return jsonError("دسترسی غیرمجاز.", 403, correlationId, "FORBIDDEN");
      }
    }

    // 3. Body — parse + validate. For methods that carry no body we still
    //    pass `null` so the handler signature stays uniform.
    let body: z.infer<NonNullable<TSchema>> | null = null;
    if (schema) {
      const isMutation = req.method !== "GET" && req.method !== "HEAD";
      if (isMutation || wantsJson) {
        let raw: unknown;
        try {
          raw = await req.json();
        } catch {
          return jsonError("بدنه درخواست نامعتبر است.", 400, correlationId, "BAD_JSON");
        }
        const parsed = schema.safeParse(raw);
        if (!parsed.success) {
          // In dev we surface the full issue list; in prod we keep it short.
          return jsonError(
            firstZodMessage(parsed.error),
            422,
            correlationId,
            "VALIDATION_ERROR",
            process.env.NODE_ENV === "development"
              ? { issues: parsed.error.issues }
              : undefined,
          );
        }
        body = parsed.data as z.infer<NonNullable<TSchema>>;
      }
    }

    // 4. Run the inner handler. Any thrown error becomes a 500.
    try {
      const response = await handler({
        // `user` is guaranteed to be SafeUser when `auth` is set — the
        // null check above short-circuits the unauthenticated path.
        user: (user ?? (await getCurrentUser())) as SafeUser,
        body,
        correlationId,
        req,
      });
      // Always echo the correlation id so clients can quote it in support
      // tickets without having to dig through logs.
      const headers = new Headers(response.headers);
      headers.set("X-Correlation-Id", correlationId);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      return handleApiError(error, correlationId, {
        req,
        ...(user ? { userId: user.id } : {}),
      });
    }
  };

  // 5. Optionally wrap with rate limiting. We keep the rate-limit on the
  //    outside so a request that's blocked never reaches the heavy
  //    body-parsing / auth lookup work.
  if (rateLimit) {
    return withRateLimit(wrapped, rateLimit, { keyPrefix: rateLimitKey });
  }
  return wrapped;
}
