import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { notFound } from "next/navigation";
import { CertificatePrint } from "@/components/certificates/CertificatePrint";

export const metadata = {
  title: "گواهی‌نامه",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CertificatePrintPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  let certs: Awaited<ReturnType<typeof repository.listCertificates>>;
  try {
    certs = await repository.listCertificates(user.id);
  } catch {
    // DB unreachable — render the 404 instead of crashing the print view.
    notFound();
  }
  const cert = certs.find((c) => c.id === id);

  if (!cert) {
    notFound();
  }

  const course = await repository.findCourseById(cert.courseId);
  if (!course) {
    notFound();
  }

  const mentor = await repository.findSafeUserById(course.mentorId);

  return (
    <CertificatePrint
      studentName={user.name}
      courseTitle={course.title}
      certificateNumber={cert.certificateNumber}
      issueDate={cert.issueDate}
      durationHours={course.durationHours}
      mentorName={mentor?.name ?? "بصیر نو"}
    />
  );
}
