import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

async function markReadHandler(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // CSRF: mark-read mutates notification state on behalf of the session.
  if (!isSameOriginRequest(_req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  const { id } = await params;
  await repository.markNotificationRead(id, user.id);

  return NextResponse.json({ ok: true });
}

/** API: max=20, burst=5 per minute. */
export const PATCH = withRateLimit(markReadHandler, RATE_LIMIT_PRESETS.API, {
  keyPrefix: "notifications:read",
});