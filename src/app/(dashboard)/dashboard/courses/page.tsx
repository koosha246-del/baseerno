import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { toPersianDigits } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { env } from "@/lib/env";
import { DemoUnavailableCard } from "@/components/shared/DemoUnavailableCard";
import { CardSkeleton } from "@/components/shared/Skeletons";
import { BookOpen, PlayCircle } from "lucide-react";

export default async function CoursesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Demo mode (no DB): show a friendly card instead of a hanging skeleton.
  if (env.demoMode) {
    return <DemoUnavailableCard />;
  }

  return (
    <Suspense fallback={<CardSkeleton />}>
      <CoursesBody role={user.role} userId={user.id} />
    </Suspense>
  );
}

function CoursesBody({ role, userId }: { role: string; userId: string }) {
  if (role === "STUDENT") return <StudentCourses userId={userId} />;
  if (role === "TEACHER") return <TeacherCourses userId={userId} />;
  return <AdminCourses />;
}

async function StudentCourses({ userId }: { userId: string }) {
  const [enrollments, grades] = await Promise.all([
    repository.listEnrollments(userId),
    repository.listGrades(userId),
  ]);

  // Only the courses the student is enrolled in — scoped query skips
  // shipping `description` for the entire catalog.
  const enrolledIds = [...new Set(enrollments.map((e) => e.courseId))];
  const courses = await repository.listCourses({
      ids: enrolledIds,
  });
  const courseById = new Map(courses.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-white">دوره‌های من</h1>
      {enrollments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="هنوز دوره‌ای نداری"
          description="از صفحه اصلی یک درس انگلیسی انتخاب کن و شروع کن."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {enrollments.map((e) => {
            const course = courseById.get(e.courseId);
            if (!course) return null;
            const grade = grades.find((g) => g.enrollmentId === e.id);
            return (
              <div
                key={e.id}
                className="rounded-xl border border-white/10 bg-slate-800/50 p-5 transition-colors hover:border-white/20 hover:bg-slate-800"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-3xl">{course.glyph}</span>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-white">{course.title}</h3>
                    <span className="text-xs text-slate-400">{course.level}</span>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>پیشرفت</span>
                    <span>{toPersianDigits(e.progress)}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${e.progress}%` }}
                    />
                  </div>
                </div>

                {grade ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">نمره:</span>
                    <span className="font-bold text-green-400">
                      {toPersianDigits(grade.score)} از ۲۰
                    </span>
                  </div>
                ) : null}

                <StatusBadge className="mt-3" status={e.status}>
                  {e.status === "COMPLETED"
                    ? "تکمیل‌شده"
                    : e.status === "DROPPED"
                      ? "لغو شده"
                      : "فعال"}
                </StatusBadge>

                {/* Entry point into the lesson player — without this the
                    learn page (and AI tutor) is unreachable for students. */}
                <Link
                  href={`/courses/${course.id}/learn`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
                >
                  <PlayCircle className="size-4" />
                  {e.progress > 0 ? "ادامه دوره" : "شروع دوره"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

async function TeacherCourses({ userId }: { userId: string }) {
  const courses = await repository.listCourses({ mentorId: userId });
  const counts = await repository.countEnrollmentsPerCourse(
    courses.map((c) => c.id),
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-white">کلاس‌های من</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => {
          const studentCount = counts.get(c.id) ?? 0;
          return (
            <div
              key={c.id}
              className="rounded-xl border border-white/10 bg-slate-800/50 p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-3xl">{c.glyph}</span>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-white">{c.title}</h3>
                  <span className="text-xs text-slate-400">{c.level} · {toPersianDigits(c.durationHours)} ساعت</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{toPersianDigits(studentCount)} دانشجو</span>
                <span>·</span>
                <span>{toPersianDigits(c.lessons)} درس</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <StatusBadge status={c.published ? "PUBLISHED" : "DRAFT"}>
                  {c.published ? "منتشرشده" : "پیش‌نویس"}
                </StatusBadge>
                <Link
                  href="/dashboard/content"
                  className="ms-auto rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:border-accent hover:text-white"
                >
                  مدیریت محتوا
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

async function AdminCourses() {
  const courses = await repository.listCourses();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-white">مدیریت دوره‌ها</h1>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-800/50">
        <table className="w-full text-sm text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-4 py-3 text-right">دوره</th>
              <th className="px-4 py-3 text-right">مدرس</th>
              <th className="px-4 py-3 text-right">قیمت</th>
              <th className="px-4 py-3 text-right">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr
                key={c.id}
                className="border-b border-white/5 transition-colors hover:bg-white/[0.06]"
              >
                <td className="px-4 py-3 font-medium text-white">
                  {c.glyph} {c.title}
                </td>
                <td className="px-4 py-3">{c.mentorId.slice(0, 8)}...</td>
                <td className="px-4 py-3">
                  {c.price ? `${toPersianDigits(c.price.toLocaleString())} ت` : "رایگان"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.published ? "PUBLISHED" : "DRAFT"}>
                    {c.published ? "فعال" : "غیرفعال"}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
