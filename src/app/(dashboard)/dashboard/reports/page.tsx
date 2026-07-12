import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { toPersianDigits } from "@/lib/format";
import { FileText, BarChart3 } from "lucide-react";
import { StatCard } from "@/features/dashboard/components/StatCard";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <BarChart3 className="size-12 text-slate-600" />
        <p className="text-slate-400">این صفحه فقط برای مدیران قابل دسترسی است.</p>
      </div>
    );
  }

  const counts = await repository.countByRole();
  const courses = await repository.listCourses();
  const enrollments = await repository.listEnrollments();
  const payments = await repository.listPayments();
  const revenue = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">گزارش‌ها</h1>
        <p className="mt-1 text-sm text-slate-400">آمار و گزارش‌های کلی پلتفرم</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="کل کاربران" value={toPersianDigits(counts.STUDENT + counts.TEACHER + counts.ADMIN)} icon={FileText} accent="brand" />
        <StatCard label="دوره‌ها" value={toPersianDigits(courses.length)} icon={BarChart3} accent="blue" />
        <StatCard label="ثبت‌نام‌ها" value={toPersianDigits(enrollments.length)} icon={BarChart3} accent="amber" />
        <StatCard label="درآمد (تومان)" value={toPersianDigits(revenue.toLocaleString())} icon={FileText} accent="green" />
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-800/50 p-6">
          <h2 className="mb-4 font-bold text-white">ثبت‌نام‌ها بر اساس نقش</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-24 text-xs text-slate-400">دانش‌آموزان</span>
              <div className="flex-1 h-4 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(counts.STUDENT / (counts.STUDENT + counts.TEACHER + counts.ADMIN)) * 100}%` }} />
              </div>
              <span className="text-xs text-white">{toPersianDigits(counts.STUDENT)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 text-xs text-slate-400">معلمان</span>
              <div className="flex-1 h-4 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${(counts.TEACHER / (counts.STUDENT + counts.TEACHER + counts.ADMIN)) * 100}%` }} />
              </div>
              <span className="text-xs text-white">{toPersianDigits(counts.TEACHER)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 text-xs text-slate-400">مدیران</span>
              <div className="flex-1 h-4 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(counts.ADMIN / (counts.STUDENT + counts.TEACHER + counts.ADMIN)) * 100}%` }} />
              </div>
              <span className="text-xs text-white">{toPersianDigits(counts.ADMIN)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800/50 p-6">
          <h2 className="mb-4 font-bold text-white">وضعیت پرداخت‌ها</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-24 text-xs text-slate-400">موفق</span>
              <div className="flex-1 h-4 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(payments.filter((p) => p.status === "PAID").length / Math.max(payments.length, 1)) * 100}%` }} />
              </div>
              <span className="text-xs text-white">{toPersianDigits(payments.filter((p) => p.status === "PAID").length)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 text-xs text-slate-400">معلق</span>
              <div className="flex-1 h-4 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${(payments.filter((p) => p.status === "PENDING").length / Math.max(payments.length, 1)) * 100}%` }} />
              </div>
              <span className="text-xs text-white">{toPersianDigits(payments.filter((p) => p.status === "PENDING").length)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
