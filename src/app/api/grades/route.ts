import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { notifyGradePosted } from "@/lib/notifications";

const schema = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1),
  score: z.number().min(0).max(20),
  feedback: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  // CSRF: grade submission mutates data on behalf of the teacher session.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "فقط معلم می‌تواند نمره ثبت کند." }, { status: 403 });
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

  const { userId, courseId, score, feedback } = parsed.data;

  const course = await repository.findCourseById(courseId);
  if (!course || course.mentorId !== user.id) {
    return NextResponse.json({ error: "شما مدرس این دوره نیستید." }, { status: 403 });
  }

  const enrollments = await repository.listEnrollmentsForCourse(courseId);
  const enrollment = enrollments.find((e) => e.userId === userId);
  if (!enrollment) {
    return NextResponse.json({ error: "دانشجو در این دوره ثبت‌نام نکرده." }, { status: 404 });
  }

  const grade = await repository.createGrade({
    userId,
    courseId,
    enrollmentId: enrollment.id,
    score,
    feedback,
    teacherId: user.id,
  });

  await notifyGradePosted(userId, course.title, score);

  return NextResponse.json({ grade }, { status: 201 });
}
