import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

async function markAllReadHandler(_req: Request) {
  // CSRF: mark-all-read mutates notification state on behalf of the session.
  if (!isSameOriginRequest(_req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  await repository.markAllNotificationsRead(user.id);

  return NextResponse.json({ ok: true });
}

/** API: max=20, burst=5 per minute. */
export const PATCH = withRateLimit(markAllReadHandler, RATE_LIMIT_PRESETS.API, {
  keyPrefix: "notifications:read-all",
});