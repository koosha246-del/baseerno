import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { toPersianDigits, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSkeleton } from "@/components/shared/Skeletons";
import { ClipboardList } from "lucide-react";
import { env } from "@/lib/env";
import { DemoUnavailableCard } from "@/components/shared/DemoUnavailableCard";
import { GradeForm } from "./GradeForm";
import { CertificateButton } from "./CertificateButton";

export default async function GradesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Demo mode (no DB): show a friendly card instead of a hanging skeleton.
  if (env.demoMode) {
    return <DemoUnavailableCard />;
  }

  return (
    <Suspense fallback={<CardSkeleton />}>
      <GradesBody role={user.role} userId={user.id} />
    </Suspense>
  );
}

function GradesBody({ role, userId }: { role: string; userId: string }) {
  if (role === "STUDENT") return <StudentGrades userId={userId} />;
  return <TeacherGrades userId={userId} />;
}

async function StudentGrades({ userId }: { userId: string }) {
  const grades = await repository.listGrades(userId);
  const courses = await repository.listCourses({
    ids: [...new Set(grades.map((g) => g.courseId))],
  });
  const courseById = new Map(courses.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">نمرات من</h1>
        <p className="mt-1 text-sm text-slate-400">نمرات ثبت‌شده در دوره‌ها</p>
      </div>

      {grades.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="هنوز نمره‌ای نیست"
          description="وقتی معلم نمره ثبت کند، اینجا می‌بینی."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {grades.map((g) => {
            const course = courseById.get(g.courseId);
            return (
              <div
                key={g.id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-800/50 p-5 transition-colors hover:border-white/20 hover:bg-slate-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{course?.glyph ?? "📚"}</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">{course?.title ?? "—"}</span>
                    {g.feedback ? (
                      <span className="text-xs text-slate-400">{g.feedback}</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "text-2xl font-extrabold",
                      g.score >= 16
                        ? "text-green-400"
                        : g.score >= 12
                          ? "text-amber-400"
                          : "text-red-400",
                    )}
                  >
                    {toPersianDigits(g.score)}
                    <span className="text-sm font-normal text-slate-400">/۲۰</span>
                  </span>
                  <span className="text-xs text-slate-500">{formatDate(g.gradedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

async function TeacherGrades({ userId }: { userId: string }) {
  // Grades + courses in parallel…
  const [grades, courses] = await Promise.all([
    repository.listGrades(undefined, userId),
    repository.listCourses({ mentorId: userId }),
  ]);

  // …then the ROSTER: every enrollment across the teacher's courses.
  // This is the source of truth for "who can be graded / certified" —
  // deriving students from existing grades created a chicken-and-egg
  // dead-end where a first grade could never be recorded.
  const roster = (
    await Promise.all(courses.map((c) => repository.listEnrollmentsForCourse(c.id)))
  ).flat();
  const rosterStudentIds = Array.from(new Set(roster.map((e) => e.userId)));

  const studentIds = Array.from(new Set([...rosterStudentIds, ...grades.map((g) => g.userId)]));
  const students =
    studentIds.length > 0 ? await repository.listUsers({ ids: studentIds }) : [];
  const studentById = new Map(students.map((u) => [u.id, u]));
  const courseById = new Map(courses.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">مدیریت نمرات</h1>
          <p className="mt-1 text-sm text-slate-400">نمرات دانشجویان دوره‌های شما</p>
        </div>
        <GradeForm
          courses={courses.map((c) => ({ id: c.id, title: c.title }))}
          students={students.map((u) => ({ id: u.id, name: u.name }))}
        />
      </div>

      {/* رستر دانشجویان — ثبت نمره و صدور گواهی از همین‌جا */}
      {roster.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-800/50">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-bold text-white">
              دانشجویان دوره‌های شما ({roster.length.toLocaleString("fa-IR")})
            </h2>
          </div>
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400">
                <th className="px-4 py-3 text-right">دانشجو</th>
                <th className="px-4 py-3 text-right">دوره</th>
                <th className="px-4 py-3 text-right">پیشرفت</th>
                <th className="px-4 py-3 text-right">وضعیت</th>
                <th className="px-4 py-3 text-right">اقدامات</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((e) => {
                const student = studentById.get(e.userId);
                const course = courseById.get(e.courseId);
                return (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium text-white">
                      {student?.name ?? e.userId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">{course?.title ?? "—"}</td>
                    <td className="px-4 py-3">{toPersianDigits(e.progress)}%</td>
                    <td className="px-4 py-3">
                      {e.status === "COMPLETED"
                        ? "تکمیل‌شده"
                        : e.status === "DROPPED"
                          ? "لغو شده"
                          : "فعال"}
                    </td>
                    <td className="px-4 py-3">
                      <CertificateButton
                        userId={e.userId}
                        courseId={e.courseId}
                        enrollmentId={e.id}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {grades.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-slate-800/50 p-12 text-center">
          <p className="text-slate-400">هنوز نمره‌ای ثبت نشده.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-800/50">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400">
                <th className="px-4 py-3 text-right">دانشجو</th>
                <th className="px-4 py-3 text-right">دوره</th>
                <th className="px-4 py-3 text-right">نمره</th>
                <th className="px-4 py-3 text-right">بازخورد</th>
                <th className="px-4 py-3 text-right">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => {
                const course = courses.find((c) => c.id === g.courseId);
                const student = students.find((u) => u.id === g.userId);
                return (
                  <tr key={g.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium text-white">{student?.name ?? g.userId.slice(0, 8)}</td>
                    <td className="px-4 py-3">{course?.title ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "font-bold",
                        g.score >= 16 ? "text-green-400" : g.score >= 12 ? "text-amber-400" : "text-red-400"
                      )}>
                        {toPersianDigits(g.score)}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{g.feedback ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{new Date(g.gradedAt).toLocaleDateString("fa-IR")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
