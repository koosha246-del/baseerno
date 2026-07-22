import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { CertificatePdfDocument } from "@/components/certificates/CertificatePdfDocument";

/**
 * GET /api/certificates/[id]/pdf
 *
 * Server-side PDF generation using `@react-pdf/renderer`. Streams a
 * `application/pdf` response so the user gets a real download without
 * any client-side JS or heavy renderer bundle.
 *
 * Authorization: the certificate owner OR an admin.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  const { id } = await params;

  // Look up the certificate scoped to the caller's permissions.
  let cert;
  if (user.role === "ADMIN") {
    cert = await repository.findCertificateById(id);
  } else {
    const mine = await repository.listCertificates(user.id);
    cert = mine.find((c) => c.id === id);
  }

  if (!cert) {
    return NextResponse.json(
      { error: "گواهی‌نامه یافت نشد." },
      { status: 404 },
    );
  }

  const [course, student] = await Promise.all([
    repository.findCourseById(cert.courseId),
    repository.findSafeUserById(cert.userId),
  ]);

  const mentor = course?.mentorId
    ? await repository.findSafeUserById(course.mentorId)
    : null;

  try {
    const buffer = await renderToBuffer(
      CertificatePdfDocument({
        studentName: student?.name ?? "—",
        courseTitle: course?.title ?? "—",
        certificateNumber: cert.certificateNumber,
        issueDate: cert.issueDate.toISOString().slice(0, 10),
        durationHours: course?.durationHours ?? 0,
        mentorName: mentor?.name ?? "—",
      }),
    );

    // NextResponse expects a BodyInit. Wrap the Buffer in a Blob so
    // TypeScript narrows it correctly; browsers will receive a real
    // binary stream regardless of the in-process representation.
    const blob = new Blob([new Uint8Array(buffer)], { type: "application/pdf" });

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `attachment; filename="certificate-${cert.certificateNumber}.pdf"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("[GET /api/certificates/:id/pdf]", err);
    return NextResponse.json(
      { error: "خطا در تولید PDF" },
      { status: 500 },
    );
  }
}
