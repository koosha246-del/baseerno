import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest } from "@/lib/csrf";
import { notifyCertificateIssued } from "@/lib/notifications";
import { CACHE_TAGS } from "@/lib/cache-tags";

const issueSchema = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1),
  enrollmentId: z.string().min(1),
});

/**
 * POST /api/admin/certificates
 *
 * Admin/teacher endpoint to manually issue a certificate for a
 * completed enrollment. The notification trigger fires as a side
 * effect so the student always knows their cert is ready.
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

  const course = await repository.findCourseById(parsed.data.courseId);
  if (course) {
    await notifyCertificateIssued(parsed.data.userId, course.title);
  }

  revalidateTag(CACHE_TAGS.certificates);
  revalidateTag(CACHE_TAGS.user(parsed.data.userId));
  revalidateTag(CACHE_TAGS.notifications);

  return NextResponse.json({ certificate }, { status: 201 });
}
