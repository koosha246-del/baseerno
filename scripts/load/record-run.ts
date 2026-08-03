/**
 * Record a k6 load-test run into the LoadRun table so the Ops dashboard
 * can chart p95 / error trends over time.
 *
 * Reads scripts/load/result.json (written by the k6 handleSummary in
 * scripts/load/k6-script.js) and stores it with the gate verdict.
 *
 * Usage:
 *   npm run record:load                      # uses scripts/load/result.json
 *   npx tsx scripts/load/record-run.ts <path>  # custom result file
 *
 * Exit code: 0 on success (even when gates failed — the run is still
 * worth recording); 1 when the file is missing/unreadable.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
// Static TYPE-only import — erased at compile time, so it doesn't interfere
// with the loadDotEnv-before-value-import ordering below.
import type { LoadResult } from "@/lib/load-analysis";

/** Minimal .env loader — dev convenience; exported vars always win. */
function loadDotEnv(): void {
  try {
    const content = readFileSync(".env", "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]!]) {
        process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env file — rely on the exported environment.
  }
}

loadDotEnv();

const defaultPath = resolve(process.cwd(), "scripts/load/result.json");
const filePath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : defaultPath;

async function main() {
  // Dynamic import ON PURPOSE: static imports are hoisted above loadDotEnv()
  // in ESM, so prisma/env would read process.env before .env is loaded.
  const { recordLoadRun, listLoadRuns } = await import("@/lib/db/domains/load-runs.repo");
  const { analyzeLoad } = await import("@/lib/load-analysis");
  const { detectRegressions } = await import("@/lib/load-alerts");
  const { publish } = await import("@/lib/events");

  let raw: string;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch {
    console.error(`❌ result.json پیدا نشد: ${filePath}`);
    console.error("اول load test را اجرا کن: npm run test:load");
    process.exit(1);
    return;
  }

  let result: LoadResult;
  try {
    result = JSON.parse(raw) as LoadResult;
  } catch {
    console.error("❌ result.json قابل parse نیست (JSON نامعتبر).");
    process.exit(1);
    return;
  }

  const { pass, verdicts } = analyzeLoad(result);
  const durationSeconds = Number(process.env.LOAD_DURATION?.replace(/s$/, "") ?? 60);

  // Baseline BEFORE inserting the current run — the fresh run must never
  // skew its own comparison window.
  const history = await listLoadRuns(5);

  await recordLoadRun({
    baseUrl: result.baseUrl ?? "unknown",
    vus: result.vus ?? 0,
    durationSeconds,
    pass,
    scenarios: {
      browse: result.browse,
      search: result.search,
      auth: result.auth,
      dashboard: result.dashboard,
    },
    cacheHits: result.cacheSMaxageHits ?? 0,
  });

  // Performance-regression alert → Event Bus → admin notification + audit.
  const regressions = detectRegressions(result, history);
  for (const regression of regressions) {
    console.warn(
      `⚠️ رگرسیون ${regression.scenario}: p95 از ${Math.round(regression.previousAvgP95)} به ${Math.round(regression.currentP95)} ms (+${Math.round(regression.diffPercent)}٪)`,
    );
    await publish({ type: "load:regression", ...regression });
  }
  if (regressions.length === 0) {
    console.log("✅ بدون رگرسیون نسبت به اجراهای قبلی.");
  }

  const gated = verdicts.filter((v) => !v.skipped).length;
  const failed = verdicts.filter((v) => !v.pass).length;
  console.log(`✅ Load run ثبت شد — pass=${pass} (${failed}/${gated} گیت رد شد)`);
}

main().catch((e) => {
  console.error("❌ خطا:", e);
  process.exit(1);
});
