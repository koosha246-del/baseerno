/**
 * Sync courses to CourseSearch — called after course create/update.
 *
 * POST /api/admin/search-sync
 *   {"courseId": "c_fundamentals"}  → sync single course
 *   {}                              → sync all published courses
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { syncCourseSearch } from "@/lib/db/domains/search.repo";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی محدود شده." }, { status: 403 });
  }

  let body: { courseId?: string } = {};
  try {
    body = await req.json();
  } catch {
    // no body — sync all
  }

  const count = await syncCourseSearch(body.courseId);

  return NextResponse.json({
    ok: true,
    synced: count,
    message: `${count} دوره همگام‌سازی شدند.`,
  });
}