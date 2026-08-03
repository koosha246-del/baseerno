import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest } from "@/lib/csrf";
import { publish } from "@/lib/events";

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
export async function POST(req: Request) {
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
    return NextResponse.json(
      { error: "داده‌های نامعتبر", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const certificate = await repository.issueCertificate(parsed.data);

  // Event bus: sends the student notification AND revalidates the
  // certificates / user / notifications cache tags (events.ts).
  const course = await repository.findCourseById(parsed.data.courseId);
  await publish({
    type: "certificate:issued",
    userId: parsed.data.userId,
    courseName: course?.title ?? "دوره",
  });

  return NextResponse.json({ certificate }, { status: 201 });
}
