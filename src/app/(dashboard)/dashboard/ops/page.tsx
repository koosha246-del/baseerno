import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getHealthReport } from "@/lib/health";
import { snapshotMetrics } from "@/lib/metrics";
import { toPersianDigits, formatDate } from "@/lib/format";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { repository } from "@/lib/db/repository";
import { sloReport } from "@/lib/slo";
import type { LoadResult } from "@/lib/load-analysis";
import { LoadTrendChart, type LoadTrendPoint } from "@/features/ops/components/LoadTrendChart";
import { SloHeatmap } from "@/features/ops/components/SloHeatmap";
import { env } from "@/lib/env";
import { DemoUnavailableCard } from "@/components/shared/DemoUnavailableCard";
import {
  Activity,
  Database,
  Radio,
  Search,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Gauge,
  Archive,
} from "lucide-react";

/**
 * Ops dashboard (admin-only).
 *
 * Shows live dependency health (same checks as /api/health, reused from
 * src/lib/health.ts) plus the in-memory runtime metrics snapshot
 * (counters + slowest Prisma queries). Reading the metrics here resets
 * the counters — same scrape semantics as GET /api/metrics — so memory
 * stays bounded.
 */
export const dynamic = "force-dynamic";

const checkLabel: Record<string, string> = {
  db: "دیتابیس",
  redis: "Redis",
  search: "جستجو",
  emailOutboxBacklog: "صف ایمیل",
};

const checkIcon: Record<string, typeof Database> = {
  db: Database,
  redis: Radio,
  search: Search,
  emailOutboxBacklog: Mail,
};

/**
 * Validate a stored LoadRun.scenarios row and read a scenario's p95.
 * Returns null when the JSON shape is unrecognizable or the scenario
 * never ran (CI smoke without credentials).
 */
function scenarioP95(run: {
  scenarios: unknown;
  baseUrl: string;
  vus: number;
}, scenario: "browse" | "search" | "dashboard"): number | null {
  const candidate = {
    ...(run.scenarios as object),
    baseUrl: run.baseUrl,
    vus: run.vus,
  } as LoadResult;
  return repository.isLoadResult(candidate) ? (candidate[scenario]?.p95 ?? null) : null;
}

export default async function OpsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <ShieldCheck className="size-12 text-slate-600" />
        <p className="text-slate-400">این صفحه فقط برای مدیران قابل دسترسی است.</p>
      </div>
    );
  }

  // Demo mode (no DB): show a friendly card instead of a hanging skeleton.
  if (env.demoMode) {
    return <DemoUnavailableCard />;
  }

  const [health, metrics, loadRuns] = await Promise.all([
    getHealthReport(),
    snapshotMetrics(true),
    repository.listLoadRuns(30),
  ]);

  // API SLO — per-5-minute buckets recorded by withRateLimit.
  const sloBuckets = sloReport(24);
  const sloTotals = sloBuckets.reduce(
    (acc, bucket) => {
      for (const stats of Object.values(bucket.perGroup)) {
        acc.requests += stats.requests;
        acc.errors += stats.errors;
      }
      return acc;
    },
    { requests: 0, errors: 0 },
  );
  const sloErrorRate =
    sloTotals.requests > 0 ? (sloTotals.errors / sloTotals.requests) * 100 : 0;

  // Oldest → newest for the chart (recharts draws left-to-right).
  const loadTrendData: LoadTrendPoint[] = [...loadRuns]
    .reverse()
    .map((run) => ({
      label: formatDate(run.createdAt, "datetime"),
      browseP95: scenarioP95(run, "browse"),
      searchP95: scenarioP95(run, "search"),
      dashboardP95: scenarioP95(run, "dashboard"),
      pass: run.pass,
    }));

  const counterLabels: Record<string, string> = {
    "auth:login": "ورود موفق",
    "auth:register": "ثبتنام",
    "auth:failed": "ورود ناموفق",
    "payment:success": "پرداخت موفق",
    "payment:failed": "پرداخت ناموفق",
    "enrollment:free": "ثبتنام رایگان",
    "enrollment:paid": "ثبتنام پولی",
    "search:query": "جستجو",
    "ai:message": "پیام AI",
    "api:error": "خطای API",
  };

  // Slowest queries first — operational signal for missing indexes.
  const slowQueries = Object.entries(metrics.histograms)
    .filter(([k]) => k.startsWith("prisma:"))
    .sort((a, b) => b[1].avgMs - a[1].avgMs)
    .slice(0, 8);

  // Latest run summary (used by the history section footer).
  const latest = loadRuns[0];
  const latestBrowseP95 = latest ? scenarioP95(latest, "browse") : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">عملیات</h1>
        <p className="mt-1 text-sm text-slate-400">
          سلامت سرویسها و متریکهای لحظهای
          <span className="ms-2 text-[0.65rem] text-slate-500">
            (snapshot: {new Date(metrics.sampledAt).toLocaleTimeString("fa-IR")})
          </span>
        </p>
      </div>

      {/* Dependency health — same checks as /api/health */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Activity className="size-4 text-accent" />
          سلامت وابستگیها
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(health.checks).map(([key, value]) => {
            const Icon = checkIcon[key] ?? Activity;
            // emailOutboxBacklog is informational — display its actual
            // value (count or "unknown") instead of a status glyph.
            const isBacklog = key === "emailOutboxBacklog";
            const ok = value === "ok";
            const accent = isBacklog
              ? "blue"
              : ok
                ? "green"
                : value === "not_configured"
                  ? "navy"
                  : "amber";
            return (
              <StatCard
                key={key}
                label={checkLabel[key] ?? key}
                value={
                  isBacklog
                    ? value
                    : ok
                      ? "✓"
                      : value === "not_configured"
                        ? "پیکربندی نشده"
                        : value
                }
                icon={Icon}
                accent={accent as "green" | "blue" | "navy" | "amber"}
              />
            );
          })}
        </div>
      </div>

      {/* Runtime counters */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
          <AlertTriangle className="size-4 text-accent" />
          متریکهای اخیر (از آخرین snapshot)
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(counterLabels).map(([key, label]) => (
            <div
              key={key}
              className="rounded-xl border border-white/10 bg-slate-800/50 p-4"
            >
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-1 text-xl font-extrabold text-white" dir="ltr">
                {toPersianDigits(metrics.counters[key] ?? 0)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Load-test history */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Gauge className="size-4 text-accent" />
          تاریخچه Load Test
          {loadRuns.length > 0 && (
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.65rem] font-medium text-slate-400">
              {toPersianDigits(loadRuns.length)} اجرا
            </span>
          )}
        </h2>
        <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
          <LoadTrendChart data={loadTrendData} />
          {latest && (
            <p className="mt-3 text-xs text-slate-500">
              آخرین اجرا: {formatDate(latest.createdAt, "datetime")} —{" "}
              {latest.pass ? "پاس" : "رد"} (browse p95:{" "}
              {toPersianDigits(latestBrowseP95 ?? "—")} ms)
            </p>
          )}
          <div className="mt-4 border-t border-white/5 pt-3">
            <Link
              href="/dashboard/ops/archive"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent/80"
            >
              <Archive className="size-4" />
              آرشیو کامل + مقایسه اجراها
            </Link>
          </div>
        </div>
      </div>

      {/* API SLO — 5-minute buckets from withRateLimit */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Gauge className="size-4 text-accent" />
          SLO ی API (باکت‌های ۵ دقیقه‌ای)
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.65rem] font-medium text-slate-400">
            ۲۴ ساعت اخیر
          </span>
        </h2>
        <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
          <SloHeatmap buckets={sloBuckets} hours={24} />
          <p className="mt-3 text-xs text-slate-500">
            مجموع ۲۴ ساعت: {toPersianDigits(sloTotals.requests)} درخواست · نرخ خطا{" "}
            {toPersianDigits(sloErrorRate.toFixed(1))}٪ — پوشش: route های
            rate-limited (withRateLimit).
          </p>
        </div>
      </div>

      {/* Slowest Prisma queries */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Database className="size-4 text-accent" />
          کندترین کوئریها
        </h2>
        {slowQueries.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-slate-800/50 p-4 text-sm text-slate-400">
            هنوز کوئریای ثبت نشده.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-800/50">
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-400">
                  <th className="px-4 py-3 text-right">کوئری</th>
                  <th className="px-4 py-3 text-right">تعداد</th>
                  <th className="px-4 py-3 text-right">میانگین</th>
                  <th className="px-4 py-3 text-right">p95 تقریبی</th>
                  <th className="px-4 py-3 text-right">حداکثر</th>
                </tr>
              </thead>
              <tbody>
                {slowQueries.map(([key, h]) => (
                  <tr
                    key={key}
                    className="border-b border-white/5 transition-colors hover:bg-white/[0.06]"
                  >
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                      {key}
                    </td>
                    <td className="px-4 py-3">{toPersianDigits(h.count)}</td>
                    <td className="px-4 py-3">{toPersianDigits(h.avgMs)} ms</td>
                    <td className="px-4 py-3">{toPersianDigits(h.approxP95Ms)} ms</td>
                    <td className="px-4 py-3">{toPersianDigits(h.maxMs)} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
