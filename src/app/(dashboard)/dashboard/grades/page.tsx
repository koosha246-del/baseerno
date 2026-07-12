import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { GradeForm } from "./GradeForm";

export default async function GradesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role === "STUDENT") {
    const grades = await repository.listGrades(user.id);
    const courses = await repository.listCourses();

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">نمرات من</h1>
          <p className="mt-1 text-sm text-slate-400">نمرات ثبت‌شده در دوره‌ها</p>
        </div>

        {grades.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-slate-800/50 p-12 text-center">
            <p className="text-slate-400">هنوز نمره‌ای ثبت نشده.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {grades.map((g) => {
              const course = courses.find((c) => c.id === g.courseId);
              return (
                <div
                  key={g.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-800/50 p-5 sm:flex-row sm:items-center sm:justify-between"
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
                        g.score >= 16 ? "text-green-400" : g.score >= 12 ? "text-amber-400" : "text-red-400"
                      )}
                    >
                      {toPersianDigits(g.score)}
                      <span className="text-sm font-normal text-slate-400">/۲۰</span>
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(g.gradedAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // TEACHER: grade management
  const grades = await repository.listGrades(undefined, user.id);
  const courses = await repository.listCourses({ mentorId: user.id });
  const allUsers = await repository.listUsers({ role: "STUDENT" });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">مدیریت نمرات</h1>
          <p className="mt-1 text-sm text-slate-400">نمرات دانشجویان دوره‌های شما</p>
        </div>
        <GradeForm
          courses={courses.map((c) => ({ id: c.id, title: c.title }))}
          students={allUsers.map((u) => ({ id: u.id, name: u.name }))}
        />
      </div>

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
                const student = allUsers.find((u) => u.id === g.userId);
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
