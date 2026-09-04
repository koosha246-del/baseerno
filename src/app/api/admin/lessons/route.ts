import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { z } from "zod";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { invalidateCache, invalidateSearchCourseCache } from "@/lib/cache";
import { CACHE_TAGS, publishedCoursesCacheKeys } from "@/lib/cache-tags";

const createLessonSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(200),
  type: z.enum(["video", "text", "quiz"]).default("video"),
  videoUrl: z.string().url().nullish(),
  durationMinutes: z.number().min(1).max(600),
  sortOrder: z.number().min(0).default(0),
  isFree: z.boolean().default(false),
  published: z.boolean().default(true),
});

async function createLessonHandler(req: Request) {
  try {
    // CSRF: lesson creation mutates course content on behalf of the session.
    if (!isSameOriginRequest(req)) {
      return csrfRejectedResponse();
    }

    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "بدنه درخواست نامعتبر است" }, { status: 400 });
    }
    const parsed = createLessonSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "داده‌های نامعتبر" },
        { status: 400 }
      );
    }

    // A TEACHER may only add lessons to a course they own.
    if (user.role === "TEACHER") {
      const course = await repository.findCourseById(parsed.data.courseId);
      if (!course || course.mentorId !== user.id) {
        return NextResponse.json(
          { error: "شما مدرس این دوره نیستید" },
          { status: 403 }
        );
      }
    }

    const lesson = await repository.createLesson({
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      type: parsed.data.type,
      videoUrl: parsed.data.videoUrl ?? undefined,
      durationMinutes: parsed.data.durationMinutes,
      sortOrder: parsed.data.sortOrder,
      isFree: parsed.data.isFree,
      published: parsed.data.published,
    });

    // Bust the Redis published-course keys AND the Next.js tags so the
    // course catalog / homepage reflect the new lesson immediately.
    await invalidateCache(publishedCoursesCacheKeys(), [
      CACHE_TAGS.lessons,
      CACHE_TAGS.course(parsed.data.courseId),
      CACHE_TAGS.courses,
    ]);
    await invalidateSearchCourseCache();

    return NextResponse.json(lesson, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/lessons]", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/** API: max=20/min — privileged content mutations must not be unthrottled. */
export const POST = withRateLimit(createLessonHandler, RATE_LIMIT_PRESETS.API, {
  keyPrefix: "admin:lessons",
});
