import { NextResponse } from "next/server";
import {
  forgotPassword,
  forgotPasswordSchema,
  buildUseCaseResponse,
} from "@/lib/useCases/auth/forgotPassword";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

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

  // Execute business logic
  const result = await forgotPassword(parsed.data);
  return buildUseCaseResponse(result);
}

/** AUTH: max=5, burst=2 per minute. */
export const POST = withRateLimit(forgotPasswordHandler, RATE_LIMIT_PRESETS.AUTH, {
  keyPrefix: "auth:forgot",
});
