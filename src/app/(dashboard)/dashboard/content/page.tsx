import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { toPersianDigits } from "@/lib/format";
import { groupBy } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Video, FileCheck, BookOpen, Shield } from "lucide-react";
import { env } from "@/lib/env";
import { DemoUnavailableCard } from "@/components/shared/DemoUnavailableCard";
import { CourseForm } from "./CourseForm";
import { LessonForm } from "./LessonForm";

interface LessonRow {
  id: string;
  courseId: string;
  title: string;
  type: string;
  durationMinutes: number;
  sortOrder: number;
  isFree: boolean;
  published: boolean;
  videoUrl: string | null;
}

/**
 * Content management page.
 *
 * Authorization:
 *   - ADMIN:  sees ALL courses (cross-teacher view)
 *   - TEACHER: sees only their own courses
 *   - STUDENT: forbidden — this page is for course owners
 *
 * Performance:
 *   - Lessons for all visible courses are fetched in a SINGLE query via
 *     `listLessonsForCourses` (was N+1 — one query per course).
 *   - Results are grouped by `courseId` in memory and passed to each
 *     course card, so the page does at most 1 lesson query total.
 */
export default async function ContentPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Role check: students don't have courses to manage.
  if (user.role === "STUDENT") {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Shield className="size-12 text-slate-600" />
        <h1 className="text-xl font-bold text-white">دسترسی محدود</h1>
        <p className="max-w-md text-sm text-slate-400">
          این صفحه فقط برای معلمان و مدیران در دسترسه. دانش‌آموزان می‌تونن از
          بخش «دوره‌های من» دوره‌هاشون رو ببینن.
        </p>
      </div>
    );
  }

  // Demo mode (no DB): show a friendly card instead of a hanging skeleton.
  if (env.demoMode) {
    return <DemoUnavailableCard />;
  }

  // ADMIN sees the full catalog; TEACHER sees only their own.
  const isAdmin = user.role === "ADMIN";
  const courses = isAdmin
    ? await repository.listCourses({})
    : await repository.listCourses({ mentorId: user.id });

  const allLessons =
    courses.length > 0
      ? await repository.listLessonsForCourses(courses.map((c) => c.id))
      : [];
  const lessonsByCourse = groupBy(allLessons, (l) => l.courseId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">محتوا و درس‌ها</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isAdmin
              ? "مدیریت تمام دوره‌های پلتفرم"
              : "مدیریت دوره‌های خودت"}
          </p>
        </div>
        <CourseForm />
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="هنوز دوره‌ای نداری"
          description="اولین دوره انگلیسی‌ات را بساز تا بتوانی درس اضافه کنی."
          action={<CourseForm />}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {courses.map((course) => (
            <CourseLessons
              key={course.id}
              course={course}
              lessons={lessonsByCourse.get(course.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseLessons({
  course,
  lessons,
}: {
  course: { id: string; title: string; published: boolean };
  lessons: LessonRow[];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{course.title}</h2>
          <span className="flex items-center gap-2 text-xs text-slate-400">
            <StatusBadge status={course.published ? "PUBLISHED" : "DRAFT"}>
              {course.published ? "منتشرشده" : "پیش‌نویس"}
            </StatusBadge>
            <span>{toPersianDigits(lessons.length)} درس</span>
          </span>
        </div>
        <LessonForm courseId={course.id} />
      </div>

      {lessons.length === 0 ? (
        <EmptyState
          size="sm"
          icon={FileCheck}
          title="هنوز درسی نیست"
          description="با دکمه «درس جدید» اولین درس را اضافه کن."
          className="border-white/5 bg-white/[0.02] py-8"
        />
      ) : (
        <div className="flex flex-col gap-2">
          {lessons.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                {l.type === "video" ? (
                  <Video className="size-4 text-blue-400" />
                ) : (
                  <FileCheck className="size-4 text-amber-400" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{l.title}</span>
                  <span className="text-xs text-slate-400">
                    {toPersianDigits(l.durationMinutes)} دقیقه
                    {l.isFree ? " · رایگان" : ""}
                  </span>
                </div>
              </div>
              <StatusBadge status={l.published ? "PUBLISHED" : "DRAFT"}>
                {l.published ? "منتشر" : "پیش‌نویس"}
              </StatusBadge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
