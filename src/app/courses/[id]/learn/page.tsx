import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { LearnClient } from "./LearnClient";
import { siteConfig } from "@/config/site";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const course = await repository.findCourseById(id);
  if (!course) return {};
  return {
    title: `${course.title} | ${siteConfig.name}`,
    description: course.subtitle,
  };
}

export default async function LearnPage({ params }: PageProps) {
  const { id: courseId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Verify enrollment
  const enrollment = await repository.findEnrollment(user.id, courseId);
  if (!enrollment) {
    redirect(`/courses/${courseId}`);
  }

  // Fetch lessons (teachers & admins see all)
  const lessons =
    user.role === "ADMIN" || user.role === "TEACHER"
      ? await repository.listAllLessons(courseId)
      : await repository.listLessons(courseId);

  const course = await repository.findCourseById(courseId);
  if (!course) notFound();

  return (
    <LearnClient
      course={course}
      lessons={lessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        videoUrl: l.videoUrl,
        durationMinutes: l.durationMinutes,
        sortOrder: l.sortOrder,
        isFree: l.isFree,
        published: l.published,
      }))}
      initialLessonId={lessons[0]?.id ?? null}
    />
  );
}
