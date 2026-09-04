import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { z } from "zod";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { invalidateCache, invalidateSearchCourseCache } from "@/lib/cache";
import { CACHE_TAGS, publishedCoursesCacheKeys } from "@/lib/cache-tags";

const updateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(["video", "text", "quiz"]).optional(),
  videoUrl: z.string().url().nullish(),
  durationMinutes: z.number().min(1).max(600).optional(),
  sortOrder: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
  published: z.boolean().optional(),
});

/** A TEACHER may only act on lessons in courses they own. */
async function assertTeacherOwnsLesson(
  user: { id: string; role: string },
  courseId: string,
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  const course = await repository.findCourseById(courseId);
  return course?.mentorId === user.id;
}

async function updateLessonHandler(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF: lesson update mutates course content on behalf of the session.
    if (!isSameOriginRequest(req)) {
      return csrfRejectedResponse();
    }

    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await repository.findLessonById(id);
    if (!existing) {
      return NextResponse.json({ error: "درس یافت نشد" }, { status: 404 });
    }

    // Ownership gate: a teacher cannot edit another teacher's lesson.
    if (!(await assertTeacherOwnsLesson(user, existing.courseId))) {
      return NextResponse.json(
        { error: "شما مدرس این دوره نیستید" },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "بدنه درخواست نامعتبر است" }, { status: 400 });
    }
    const parsed = updateLessonSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "داده‌های نامعتبر" },
        { status: 400 }
      );
    }

    const patch: Parameters<typeof repository.updateLesson>[1] = {};
    if (parsed.data.title !== undefined) patch.title = parsed.data.title;
    if (parsed.data.type !== undefined) patch.type = parsed.data.type;
    if (parsed.data.videoUrl !== undefined) patch.videoUrl = parsed.data.videoUrl;
    if (parsed.data.durationMinutes !== undefined) patch.durationMinutes = parsed.data.durationMinutes;
    if (parsed.data.sortOrder !== undefined) patch.sortOrder = parsed.data.sortOrder;
    if (parsed.data.isFree !== undefined) patch.isFree = parsed.data.isFree;
    if (parsed.data.published !== undefined) patch.published = parsed.data.published;

    const updated = await repository.updateLesson(id, patch);
    // Bust the Redis published-course keys AND the Next.js tags.
    await invalidateCache(publishedCoursesCacheKeys(), [
      CACHE_TAGS.lessons,
      CACHE_TAGS.course(existing.courseId),
      CACHE_TAGS.courses,
    ]);
    await invalidateSearchCourseCache();
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/admin/lessons/:id]", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export const PATCH = withRateLimit(
  updateLessonHandler,
  RATE_LIMIT_PRESETS.API,
  { keyPrefix: "admin:lessons:update" },
);

async function deleteLessonHandler(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF: lesson deletion mutates course content on behalf of the session.
    if (!isSameOriginRequest(_req)) {
      return csrfRejectedResponse();
    }

    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await repository.findLessonById(id);
    if (!existing) {
      return NextResponse.json({ error: "درس یافت نشد." }, { status: 404 });
    }
    await repository.deleteLesson(id);
    // Bust the Redis published-course keys AND the Next.js tags.
    await invalidateCache(publishedCoursesCacheKeys(), [
      CACHE_TAGS.lessons,
      ...(existing?.courseId
        ? [CACHE_TAGS.course(existing.courseId)]
        : []),
      CACHE_TAGS.courses,
    ]);
    await invalidateSearchCourseCache();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/lessons/:id]", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/** DELETE is ADMIN-only — still throttle it per client. */
export const DELETE = withRateLimit(
  deleteLessonHandler,
  RATE_LIMIT_PRESETS.API,
  { keyPrefix: "admin:lessons:delete" },
);
