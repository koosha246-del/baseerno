/**
 * Sync courses to CourseSearch — called after course create/update.
 *
 * POST /api/admin/search-sync
 *   {"courseId": "c_fundamentals"}  → sync single course
 *   {}                              → sync all published courses
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { syncCourseSearch } from "@/lib/db/domains/search.repo";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

async function searchSyncHandler(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی محدود شده." }, { status: 403 });
  }
  // CSRF: search re-sync mutates the search index on behalf of the admin session.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  let body: { courseId?: string } = {};
  try {
    body = await req.json();
  } catch {
    // no body — sync all
  }
  // `JSON.parse("null")` returns null (not an object) — guard before the
  // property access, and reject non-string values instead of passing them
  // into the sync query.
  if (body === null || typeof body !== "object") body = {};
  const courseId =
    typeof body.courseId === "string" && body.courseId.length > 0
      ? body.courseId
      : undefined;

  const count = await syncCourseSearch(courseId);

  return NextResponse.json({
    ok: true,
    synced: count,
    message: `${count} دوره همگام‌سازی شدند.`,
  });
}

/**
 * WRITE+ burst: a re-sync is a heavy index rebuild — throttle it per
 * client even though only ADMIN can pass the guard (defence in depth).
 */
export const POST = withRateLimit(searchSyncHandler, RATE_LIMIT_PRESETS.API, {
  keyPrefix: "admin:search-sync",
});