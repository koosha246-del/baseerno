"use client";

/**
 * Client-side wrapper for the four Recharts visualizations used on the
 * admin reports page.
 *
 * Why this file exists:
 *   Recharts is a client-only library. To keep the page bundle small we
 *   load each chart through `next/dynamic` with `ssr: false`. In Next.js
 *   15, `ssr: false` is not allowed inside Server Components — so we
 *   isolate the dynamic imports in this Client Component and the
 *   server-side reports page just renders `<ReportsCharts ... />`.
 *
 * The wrapper also owns the 2x2 responsive grid and the card chrome
 * (background, border, title) so the server page stays purely about
 * data fetching + role gating.
 */
import dynamic from "next/dynamic";

const EnrollmentChart = dynamic(
  () =>
    import("./EnrollmentChart").then((m) => ({ default: m.EnrollmentChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

const RevenueChart = dynamic(
  () =>
    import("./RevenueChart").then((m) => ({ default: m.RevenueChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

const RoleDistribution = dynamic(
  () =>
    import("./RoleDistribution").then((m) => ({ default: m.RoleDistribution })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

const TopCoursesChart = dynamic(
  () =>
    import("./TopCoursesChart").then((m) => ({ default: m.TopCoursesChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return (
    <div
      role="status"
      aria-label="در حال بارگذاری نمودار"
      className="flex h-64 w-full animate-pulse items-center justify-center rounded-md bg-slate-700/40 text-xs text-slate-500"
    >
      در حال بارگذاری…
    </div>
  );
}

interface ReportsChartsProps {
  enrollmentsByMonth: Array<{ month: string; count: number }>;
  revenueByMonth: Array<{ month: string; total: number }>;
  roleData: Array<{ name: string; value: number }>;
  topCourses: Array<{ id?: string; title: string; enrollments: number }>;
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-6">
      <h2 className="mb-4 font-bold text-white">{title}</h2>
      {children}
    </div>
  );
}

export function ReportsCharts({
  enrollmentsByMonth,
  revenueByMonth,
  roleData,
  topCourses,
}: ReportsChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="ثبت‌نام‌ها در طول زمان">
        <EnrollmentChart data={enrollmentsByMonth} />
      </ChartCard>

      <ChartCard title="درآمد ماهانه">
        <RevenueChart data={revenueByMonth} />
      </ChartCard>

      <ChartCard title="توزیع کاربران">
        <RoleDistribution data={roleData} />
      </ChartCard>

      <ChartCard title="محبوب‌ترین دوره‌ها">
        <TopCoursesChart data={topCourses} />
      </ChartCard>
    </div>
  );
}
