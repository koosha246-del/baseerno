/**
 * Load-test regression detection — pure logic shared by:
 *   - scripts/load/record-run.ts (alerts after recording a run)
 *   - src/lib/__tests__/load-alerts.test.ts (unit tests)
 *
 * After each load-test run, each scenario's p95 is compared with the
 * average p95 of the previous runs (up to `window`, default 5). When the
 * fresh p95 exceeds that baseline by more than `thresholdPercent`, a
 * regression is reported — record-run.ts then publishes `load:regression`
 * on the Event Bus, which notifies admins and writes an AuditLog entry.
 */
import type { LoadResult, ScenarioStats } from "./load-analysis";

export interface LoadRegression {
  scenario: "browse" | "search" | "dashboard";
  currentP95: number;
  previousAvgP95: number;
  /** How much the fresh p95 exceeded the baseline, in percent. */
  diffPercent: number;
}

const SCENARIOS = ["browse", "search", "dashboard"] as const;
type Scenario = (typeof SCENARIOS)[number];

/** Read a scenario's p95 out of a stored LoadRun row (scenarios: unknown). */
function p95Of(row: unknown, scenario: Scenario): number | null {
  const scenarios = (row as { scenarios?: Partial<Record<Scenario, ScenarioStats>> | null })
    .scenarios;
  const stats = scenarios?.[scenario];
  return stats && typeof stats.p95 === "number" ? stats.p95 : null;
}

/**
 * Compare a fresh k6 result against the previous runs' p95 baseline.
 *
 * @param current          parsed k6 result.json (the run just executed)
 * @param previousRuns     rows from listLoadRuns — MUST NOT include the
 *                         current run (fetch the baseline before inserting)
 * @param thresholdPercent regression threshold in percent, default 20 (+20%)
 * @param window           how many previous runs to average, default 5
 */
export function detectRegressions(
  current: LoadResult,
  previousRuns: unknown[],
  thresholdPercent = 20,
  window = 5,
): LoadRegression[] {
  const regressions: LoadRegression[] = [];

  for (const scenario of SCENARIOS) {
    const currentP95 = current[scenario]?.p95;
    if (currentP95 === undefined) continue; // scenario didn't run this time

    const prevValues = previousRuns
      .slice(0, window)
      .map((row) => p95Of(row, scenario))
      .filter((v): v is number => v !== null);

    if (prevValues.length === 0) continue; // no baseline yet

    const previousAvgP95 = prevValues.reduce((a, b) => a + b, 0) / prevValues.length;
    if (previousAvgP95 <= 0) continue; // degenerate baseline (p95 of 0)

    const diffPercent = ((currentP95 - previousAvgP95) / previousAvgP95) * 100;

    if (diffPercent > thresholdPercent) {
      regressions.push({ scenario, currentP95, previousAvgP95, diffPercent });
    }
  }

  return regressions;
}

/**
 * Whether a regression is severe enough to page admins by email.
 * Default threshold: p95 at least 50% worse than the baseline.
 */
export function isSevereRegression(diffPercent: number, thresholdPercent = 50): boolean {
  return diffPercent > thresholdPercent;
}
