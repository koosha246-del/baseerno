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

  // Try to find the cert in the user's own list first
  const certs = await repository.listCertificates(user.id);
  const ownedCert = certs.find((c) => c.id === id);

  // Admin fallback: look up any certificate by ID
  const cert = ownedCert ?? (user.role === "ADMIN" ? await repository.findCertificateById(id) : null);

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
