import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { toPersianDigits } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function CoursesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role === "STUDENT") {
    const enrollments = await repository.listEnrollments(user.id);
    const courses = await repository.listCourses();
    const grades = await repository.listGrades(user.id);

    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-extrabold text-white">دوره‌های من</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {enrollments.map((e) => {
            const course = courses.find((c) => c.id === e.courseId);
            if (!course) return null;
            const grade = grades.find((g) => g.enrollmentId === e.id);
            return (
              <div
                key={e.id}
                className="rounded-xl border border-white/10 bg-slate-800/50 p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-3xl">{course.glyph}</span>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-white">{course.title}</h3>
                    <span className="text-xs text-slate-400">{course.level}</span>
                  </div>
                </div>

                {/* Progress bar */}
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

                <Badge
                  className={cn(
                    "mt-3",
                    e.status === "COMPLETED"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-blue-500/15 text-blue-400"
                  )}
                >
                  {e.status === "COMPLETED" ? "تکمیل‌شده" : "فعال"}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (user.role === "TEACHER") {
    const courses = await repository.listCourses({ mentorId: user.id });
    const allEnrollments = await repository.listEnrollments();

    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-extrabold text-white">کلاس‌های من</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => {
            const studentCount = new Set(
              allEnrollments.filter((e) => e.courseId === c.id).map((e) => e.userId)
            ).size;
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
                <Badge
                  className={cn(
                    "mt-3",
                    c.published
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-amber-500/15 text-amber-400"
                  )}
                >
                  {c.published ? "منتشرشده" : "پیش‌نویس"}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ADMIN
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
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium text-white">
                  {c.glyph} {c.title}
                </td>
                <td className="px-4 py-3">{c.mentorId.slice(0, 8)}...</td>
                <td className="px-4 py-3">
                  {c.price ? `${toPersianDigits(c.price.toLocaleString())} ت` : "رایگان"}
                </td>
                <td className="px-4 py-3">
                  <Badge className={c.published ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}>
                    {c.published ? "فعال" : "غیرفعال"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
