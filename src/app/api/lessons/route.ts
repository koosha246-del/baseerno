import { NextResponse } from "next/server";
import { z } from "zod";
import { repository } from "@/lib/db/repository";
import { getCurrentUser } from "@/lib/auth/session";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";

const schema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1, "عنوان درس الزامی است."),
  type: z.enum(["video", "assignment"]).default("video"),
  durationMinutes: z.number().min(1, "مدت باید حداقل ۱ دقیقه باشد."),
  sortOrder: z.number().optional(),
  isFree: z.boolean().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json({ error: "courseId الزامی است." }, { status: 400 });
  }

  const lessons = await repository.listLessons(courseId);
  return NextResponse.json({ lessons });
}

export async function POST(req: Request) {
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
