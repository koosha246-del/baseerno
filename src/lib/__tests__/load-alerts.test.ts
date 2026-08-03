import { describe, expect, it } from "vitest";
import { detectRegressions, isSevereRegression } from "@/lib/load-alerts";
import type { ScenarioStats } from "@/lib/load-analysis";

/** Minimal realistic stats — p50/p99/avg derived from p95. */
const stats = (p95: number): ScenarioStats => ({
  p50: Math.round(p95 * 0.8),
  p95,
  p99: Math.round(p95 * 1.2),
  avg: Math.round(p95 * 0.9),
  errors: 0,
});

describe("detectRegressions", () => {
  it("reports a regression when current p95 exceeds the 5-run baseline by the threshold", () => {
    const current = { browse: stats(500), search: stats(300), dashboard: stats(400) };
    const previous = Array.from({ length: 5 }, () => ({ scenarios: { browse: stats(300) } }));

    const regressions = detectRegressions(current, previous);

    expect(regressions).toHaveLength(1);
    expect(regressions[0]).toMatchObject({
      scenario: "browse",
      currentP95: 500,
      previousAvgP95: 300,
    });
    expect(regressions[0]!.diffPercent).toBeCloseTo(66.7, 1);
  });

  it("stays silent when the fresh p95 is within the threshold", () => {
    const current = { browse: stats(330) }; // +10% vs a 300ms baseline
    const previous = Array.from({ length: 5 }, () => ({ scenarios: { browse: stats(300) } }));

    expect(detectRegressions(current, previous)).toHaveLength(0);
  });

  it("skips scenarios with no baseline yet", () => {
    const current = { search: stats(1000) };
    expect(detectRegressions(current, [])).toHaveLength(0);
  });

  it("skips scenarios that did not run in the current result", () => {
    const current = { browse: stats(500) }; // dashboard/search absent
    const previous = Array.from({ length: 5 }, () => ({
      scenarios: { browse: stats(300), dashboard: stats(300) },
    }));

    const regressions = detectRegressions(current, previous);
    expect(regressions).toHaveLength(1);
    expect(regressions[0]!.scenario).toBe("browse");
  });

  it("honors a custom threshold and window", () => {
    const current = { browse: stats(350) }; // +16.7% vs 300ms baseline
    const previous = Array.from({ length: 5 }, () => ({ scenarios: { browse: stats(300) } }));

    expect(detectRegressions(current, previous)).toHaveLength(0); // default 20
    expect(detectRegressions(current, previous, 10)).toHaveLength(1);
    expect(detectRegressions(current, previous, 20, 2)).toHaveLength(0);
  });

  it("tolerates rows with missing or invalid scenario data", () => {
    const current = { browse: stats(500) };
    const previous = [{ scenarios: null }, { scenarios: { browse: { p95: "x" } } }, {}];

    expect(detectRegressions(current, previous)).toHaveLength(0);
  });
});

describe("isSevereRegression", () => {
  it("flags regressions above the default 50% threshold", () => {
    expect(isSevereRegression(51)).toBe(true);
    expect(isSevereRegression(50)).toBe(false);
    expect(isSevereRegression(10)).toBe(false);
  });

  it("honors a custom threshold", () => {
    expect(isSevereRegression(30, 25)).toBe(true);
    expect(isSevereRegression(30, 35)).toBe(false);
  });
});
