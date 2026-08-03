import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

async function logoutHandler(req: Request) {
  // CSRF: prevent a malicious site from logging the user out.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}

/** API: max=20, burst=5 per minute. */
export const POST = withRateLimit(logoutHandler, RATE_LIMIT_PRESETS.API, {
  keyPrefix: "auth:logout",
});