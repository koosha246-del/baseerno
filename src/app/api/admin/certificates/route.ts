import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest } from "@/lib/csrf";
import { publish } from "@/lib/events";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

const issueSchema = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1),
  enrollmentId: z.string().min(1),
});

/**
 * POST /api/admin/certificates
 *
 * Admin/teacher endpoint to manually issue a certificate for a
 * completed enrollment. Side effects — the student notification and
 * cache invalidation — fire via the `certificate:issued` event so the
 * route stays thin.
 */
async function issueCertificateHandler(req: Request) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "CSRF" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه نامعتبر" }, { status: 400 });
  }

  const parsed = issueSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "داده‌های نامعتبر" },
      { status: 422 },
    );
  }

  const { userId, courseId, enrollmentId } = parsed.data;

  // Consistency + ownership: the enrollment must exist, belong to the
  // given user and course, and (for teachers) the course must be theirs.
  const enrollment = await repository.findEnrollment(userId, courseId);
  if (!enrollment || enrollment.id !== enrollmentId) {
    return NextResponse.json(
      { error: "ثبت‌نام مطابقت ندارد." },
      { status: 422 },
    );
  }

  if (user.role === "TEACHER") {
    const course = await repository.findCourseById(courseId);
    if (!course || course.mentorId !== user.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
  }

  const certificate = await repository.issueCertificate(parsed.data);

  // Event bus: sends the student notification AND revalidates the
  // certificates / user / notifications cache tags (events.ts).
  const course = await repository.findCourseById(courseId);
  await publish({
    type: "certificate:issued",
    userId,
    courseName: course?.title ?? "دوره",
  });

  return NextResponse.json({ certificate }, { status: 201 });
}

/** API: max=20/min — privileged issuance must not be unthrottled. */
export const POST = withRateLimit(
  issueCertificateHandler,
  RATE_LIMIT_PRESETS.API,
  { keyPrefix: "admin:certificates" },
);
