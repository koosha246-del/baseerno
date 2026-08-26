import { NextResponse } from "next/server";
import { z } from "zod";
import { repository } from "@/lib/db/repository";
import { getCurrentUser } from "@/lib/auth/session";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

const schema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1, "عنوان درس الزامی است."),
  type: z.enum(["video", "assignment"]).default("video"),
  durationMinutes: z.number().min(1, "مدت باید حداقل ۱ دقیقه باشد."),
  sortOrder: z.number().optional(),
  isFree: z.boolean().optional(),
});

async function listLessonsHandler(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json({ error: "courseId الزامی است." }, { status: 400 });
  }

  const course = await repository.findCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });
  }

  // Unpublished courses are never exposed through the public lesson list.
  if (!course.published) {
    return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });
  }

  // Free/preview lessons are public; the full lesson list (including paid
  // video URLs) is only available to enrolled students, the course mentor,
  // and admins.
  const user = await getCurrentUser();
  const isOwner = user && (user.role === "ADMIN" || course.mentorId === user.id);
  const isEnrolled =
    user && !isOwner
      ? Boolean(await repository.findEnrollment(user.id, courseId))
      : false;

  if (!user || (!isOwner && !isEnrolled)) {
    const freeLessons = await repository.listFreeLessons(courseId);
    return NextResponse.json({ lessons: freeLessons });
  }

  const lessons = await repository.listLessons(courseId);
  return NextResponse.json({ lessons });
}

/** GET is public (free lessons) — rate limit to prevent scraping. */
export const GET = withRateLimit(listLessonsHandler, RATE_LIMIT_PRESETS.READ, {
  keyPrefix: "lessons:list",
});

async function createLessonHandler(req: Request) {
  // CSRF: lesson creation mutates course content on behalf of the teacher session.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  const { courseId, title, type, durationMinutes, sortOrder, isFree } = parsed.data;

  const course = await repository.findCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });
  }

  if (user.role === "TEACHER" && course.mentorId !== user.id) {
    return NextResponse.json({ error: "شما مدرس این دوره نیستید." }, { status: 403 });
  }

  const lessonCount = await repository.countLessons(courseId);

  const lesson = await repository.createLesson({
    courseId,
    title,
    type,
    durationMinutes,
    sortOrder: sortOrder ?? lessonCount + 1,
    isFree,
  });

  return NextResponse.json({ lesson }, { status: 201 });
}

/** API: max=20, burst=5 per minute. */
export const POST = withRateLimit(createLessonHandler, RATE_LIMIT_PRESETS.API, {
  keyPrefix: "lessons:create",
});