import { NextResponse } from "next/server";
import {
  forgotPassword,
  forgotPasswordSchema,
  buildUseCaseResponse,
} from "@/lib/useCases/auth/forgotPassword";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { checkRateLimitAsync } from "@/lib/rate-limit-async";

/**
 * Per-EMAIL budget on top of the per-IP AUTH preset: without it, an
 * attacker rotating source IPs (especially when X-Forwarded-For is
 * spoofable) could mail-bomb a single target mailbox indefinitely.
 */
const PER_EMAIL_LIMIT = { windowMs: 60 * 60_000, max: 3, burst: 1, burstWindowMs: 60_000 };

async function forgotPasswordHandler(req: Request) {
  // CSRF: prevents triggering password resets for arbitrary emails from a
  // third-party site (a harassment / amplification vector).
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  // Validate
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ایمیل معتبر وارد کنید." }, { status: 422 });
  }

  // Per-email throttle (see PER_EMAIL_LIMIT). Deliberately returns the same
  // shape as a success to the outside world? No — a 429 for a *requested*
  // address only leaks that the address is active under load, which is an
  // acceptable trade against mailbox-bombing; the primary response still
  // never confirms existence for unknown emails.
  const emailLimit = await checkRateLimitAsync(
    `auth:forgot-email:${parsed.data.email.toLowerCase().trim()}`,
    PER_EMAIL_LIMIT,
  );
  if (!emailLimit.success) {
    return NextResponse.json(
      { error: "تعداد درخواست‌ها برای این ایمیل زیاد است. لطفاً بعداً تلاش کنید." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, emailLimit.retryAfter)) },
      },
    );
  }

  // Execute business logic
  const result = await forgotPassword(parsed.data);
  return buildUseCaseResponse(result);
}

/** AUTH: max=5, burst=2 per minute. */
export const POST = withRateLimit(forgotPasswordHandler, RATE_LIMIT_PRESETS.AUTH, {
  keyPrefix: "auth:forgot",
});
