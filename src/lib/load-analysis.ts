/**
 * Load-test gate evaluation — pure logic shared by:
 *   - scripts/load/analyze.ts (CLI reading k6 result.json)
 *   - src/lib/__tests__/load-analysis.test.ts (unit tests)
 *
 * The gates mirror the thresholds baked into scripts/load/k6-script.js:
 *   - browse   p95 < 400ms, errors < 1%
 *   - search   p95 < 500ms, errors < 5%  (429s tolerated, see script)
 *   - dashboard p95 < 600ms, errors < 1%
 *
 * result.json is written by the k6 handleSummary with this shape:
 *   {
 *     timestamp, baseUrl, vus,
 *     browse:   { p50, p95, p99, avg, errors },
 *     search:   { ... }, auth: { ... }, dashboard: { ... },
 *     cacheSMaxageHits
 *   }
 */

export interface ScenarioStats {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  /** Error rate in percent (0–100). */
  errors: number;
}

export interface LoadResult {
  timestamp?: string;
  baseUrl?: string;
  vus?: number;
  browse?: ScenarioStats;
  search?: ScenarioStats;
  auth?: ScenarioStats;
  dashboard?: ScenarioStats;
  cacheSMaxageHits?: number;
}

export interface GateVerdict {
  /** Scenario key the gate applies to. */
  scenario: "browse" | "search" | "dashboard";
  /** p95 (ms) or errors (%). */
  metric: "p95" | "errors";
  limit: number;
  actual: number;
  pass: boolean;
  /** True when the scenario didn't run (e.g. CI smoke w/o credentials). */
  skipped?: boolean;
}

export interface GateDefinition {
  scenario: "browse" | "search" | "dashboard";
  metric: "p95" | "errors";
  limit: number;
  label: string;
}

export const LOAD_GATES: GateDefinition[] = [
  { scenario: "browse", metric: "p95", limit: 400, label: "browse p95" },
  { scenario: "browse", metric: "errors", limit: 1, label: "browse errors" },
  { scenario: "search", metric: "p95", limit: 500, label: "search p95" },
  { scenario: "search", metric: "errors", limit: 5, label: "search errors" },
  { scenario: "dashboard", metric: "p95", limit: 600, label: "dashboard p95" },
  { scenario: "dashboard", metric: "errors", limit: 1, label: "dashboard errors" },
];

/** Evaluate every gate against a parsed k6 result. */
export function evaluateGates(result: LoadResult): GateVerdict[] {
  return LOAD_GATES.map((gate) => {
    const stats = result[gate.scenario];
    // A scenario that never ran (CI smoke w/o credentials) is skipped,
    // not failed — only the scenarios present in the result are gated.
    if (!stats) {
      return {
        scenario: gate.scenario,
        metric: gate.metric,
        limit: gate.limit,
        actual: Number.NaN,
        pass: true,
        skipped: true,
      };
    }
    const actual = stats[gate.metric];
    return {
      scenario: gate.scenario,
      metric: gate.metric,
      limit: gate.limit,
      actual,
      pass: actual <= gate.limit,
    };
  });
}

export function allGatesPass(verdicts: GateVerdict[]): boolean {
  return verdicts.every((v) => v.pass);
}

/**
 * Turn failed gates into actionable next steps. Each mapping points at the
 * exact subsystem to investigate (replica routing, Meilisearch, edge cache).
 */
export function gateSuggestions(verdicts: GateVerdict[]): string[] {
  const failed = verdicts.filter((v) => !v.pass);
  if (failed.length === 0) return ["همه گیت‌ها پاس شدند."];

  const suggestions: string[] = [];

  const isFailed = (scenario: GateVerdict["scenario"], metric: GateVerdict["metric"]) =>
    failed.some((v) => v.scenario === scenario && v.metric === metric);

  if (isFailed("browse", "p95")) {
    suggestions.push(
      "browse کند → صفحات عمومی از کش Redis/ISR استفاده نمی‌کنند. Cache-Control در middleware و getOrSet در صفحه اصلی را بررسی کن (docs/scale-to-large.md فاز ۵).",
    );
  }
  if (isFailed("search", "p95")) {
    suggestions.push(
      "search کند → ایندکس Meilisearch را با `npm run verify:search:index` بررسی کن؛ اگر fallback ی FTS استفاده می‌شود، ایندکس خالی است یا جدول CourseSearch ردیف ندارد.",
    );
  }
  if (isFailed("dashboard", "p95")) {
    suggestions.push(
      "dashboard کند → کوئری‌های سنگین باید روی read replica بروند. DATABASE_REPLICA_URL را ست کن و runOnReplica را بررسی کن (docs/scale-to-large.md فاز ۲).",
    );
  }
  if (isFailed("browse", "errors") || isFailed("dashboard", "errors")) {
    suggestions.push(
      "خطای صفحات بالا → لاگ web را بررسی کن؛ احتمالاً DB/Redis در دسترس نیست یا ISR خطا می‌دهد.",
    );
  }
  if (isFailed("search", "errors")) {
    suggestions.push(
      "خطای جستجو بالا → 429 ها عمدی tolerates شده‌اند؛ اگر غیر از 429 است، rate limit ی search یا Meilisearch down است.",
    );
  }

  return suggestions;
}

/** Full report: verdicts + pass/fail + suggestions. */
export function analyzeLoad(result: LoadResult): {
  verdicts: GateVerdict[];
  pass: boolean;
  suggestions: string[];
} {
  const verdicts = evaluateGates(result);
  return {
    verdicts,
    pass: allGatesPass(verdicts),
    suggestions: gateSuggestions(verdicts),
  };
}
