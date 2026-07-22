import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  const { id } = await params;
  const certs = await repository.listCertificates(user.id);
  const cert = certs.find((c) => c.id === id);

  if (!cert && user.role !== "ADMIN") {
    return NextResponse.json({ error: "گواهی‌نامه یافت نشد." }, { status: 404 });
  }

  if (!cert) {
    return NextResponse.json({ error: "گواهی‌نامه یافت نشد." }, { status: 404 });
  }

  const [course, student] = await Promise.all([
    repository.findCourseById(cert.courseId),
    repository.findSafeUserById(cert.userId),
  ]);

  const mentor = course?.mentorId
    ? await repository.findSafeUserById(course.mentorId)
    : null;

  return NextResponse.json({
    studentName: student?.name ?? "—",
    courseTitle: course?.title ?? "—",
    certificateNumber: cert.certificateNumber,
    issueDate: cert.issueDate,
    durationHours: course?.durationHours ?? 0,
    mentorName: mentor?.name ?? "—",
  });
}
