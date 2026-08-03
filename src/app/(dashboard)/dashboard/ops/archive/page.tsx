import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { LoadRunsArchive, type ArchiveRun } from "@/features/ops/components/LoadRunsArchive";
import { env } from "@/lib/env";
import { DemoUnavailableCard } from "@/components/shared/DemoUnavailableCard";
import { ShieldCheck, Archive } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Load-run archive (admin-only) — full history table with filtering,
 * CSV export and side-by-side run comparison for latency regressions.
 */
export default async function LoadRunsArchivePage() {
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

  // Initial page — older runs are paginated client-side via
  // GET /api/ops/load-runs?offset=… (LoadRunsArchive "load more").
  const rows = await repository.listLoadRuns(50);
  const runs: ArchiveRun[] = rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    baseUrl: r.baseUrl,
    vus: r.vus,
    durationSeconds: r.durationSeconds,
    pass: r.pass,
    cacheHits: r.cacheHits,
    scenarios: r.scenarios as ArchiveRun["scenarios"],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-white">
          <Archive className="size-6 text-accent" />
          آرشیو اجراهای Load Test
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          تاریخچه کامل اجراهای k6 — فیلتر، دانلود CSV و مقایسه دو اجرا برای پیدا
          کردن رگرسیون latency.
        </p>
      </div>

      <LoadRunsArchive runs={runs} />
    </div>
  );
}
