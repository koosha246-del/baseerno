import { getCurrentUser } from "@/lib/auth/session";
import { toPersianDigits } from "@/lib/format";
import { FileText, BarChart3, Users, DollarSign } from "lucide-react";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { getAdminStatsBundle } from "@/lib/db/queries";
import { ReportsCharts } from "@/features/reports/components/ReportsCharts";
import { env } from "@/lib/env";
import { DemoUnavailableCard } from "@/components/shared/DemoUnavailableCard";

/**
 * Reports page (admin-only).
 *
 * Performance:
 *   - All chart + stat data is fetched in a single parallel batch
 *     via `getAdminStatsBundle` (8 SQL aggregations in parallel).
 *   - Every aggregation is wrapped in `unstable_cache` with a 60s TTL
 *     so a busy admin refreshing the page doesn't re-run heavy SQL.
 *   - The previous version loaded `listEnrollments()` and
 *     `listPayments()` just to read `.length` — that was a
 *     worst-case O(N) full-table scan per page load. Replaced with
 *     `count*` aggregations.
 */
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

  // Demo mode (no DB): show a friendly card instead of a hanging skeleton.
  if (env.demoMode) {
    return <DemoUnavailableCard />;
  }

  const {
    roleCounts,
    courseCount,
    enrollmentCount,
    paidPaymentCount,
    pendingPaymentCount,
    totalRevenue,
    enrollmentsByMonth,
    revenueByMonth,
    topCourses,
  } = await getAdminStatsBundle();

  const roleData = [
    { name: "دانش‌آموز", value: roleCounts.STUDENT },
    { name: "معلم", value: roleCounts.TEACHER },
    { name: "مدیر", value: roleCounts.ADMIN },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">گزارش‌ها</h1>
        <p className="mt-1 text-sm text-slate-400">
          آمار و گزارش‌های کلی پلتفرم
          <span className="ms-2 text-[0.65rem] text-slate-500">
            (cache: 120s)
          </span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="کل کاربران"
          value={toPersianDigits(roleCounts.STUDENT + roleCounts.TEACHER + roleCounts.ADMIN)}
          icon={Users}
          accent="brand"
        />
        <StatCard
          label="دوره‌ها"
          value={toPersianDigits(courseCount)}
          icon={BarChart3}
          accent="blue"
        />
        <StatCard
          label="ثبت‌نام‌ها"
          value={toPersianDigits(enrollmentCount)}
          icon={FileText}
          accent="amber"
        />
        <StatCard
          label="درآمد (تومان)"
          value={toPersianDigits(totalRevenue.toLocaleString())}
          icon={DollarSign}
          accent="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatCard
          label="پرداخت موفق"
          value={toPersianDigits(paidPaymentCount)}
          icon={DollarSign}
          accent="green"
        />
        <StatCard
          label="پرداخت معلق"
          value={toPersianDigits(pendingPaymentCount)}
          icon={FileText}
          accent="amber"
        />
        <StatCard
          label="نسبت تبدیل"
          value={
            paidPaymentCount > 0
              ? `${toPersianDigits(Math.round((paidPaymentCount / Math.max(1, paidPaymentCount + pendingPaymentCount)) * 100))}٪`
              : "—"
          }
          icon={BarChart3}
          accent="brand"
        />
      </div>

      {/* Charts */}
      <ReportsCharts
        enrollmentsByMonth={enrollmentsByMonth}
        revenueByMonth={revenueByMonth}
        roleData={roleData}
        topCourses={topCourses}
      />
    </div>
  );
}
