import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzeLoad,
  allGatesPass,
  evaluateGates,
  gateSuggestions,
  LOAD_GATES,
  type LoadResult,
} from "@/lib/load-analysis";

const passingResult: LoadResult = {
  timestamp: "2026-07-31T00:00:00Z",
  baseUrl: "https://baseerno.example",
  vus: 50,
  browse: { p50: 120, p95: 300, p99: 380, avg: 150, errors: 0.2 },
  search: { p50: 80, p95: 250, p99: 400, avg: 100, errors: 2 },
  auth: { p50: 200, p95: 450, p99: 600, avg: 220, errors: 4 },
  dashboard: { p50: 180, p95: 450, p99: 700, avg: 250, errors: 0.5 },
  cacheSMaxageHits: 120,
};

describe("evaluateGates", () => {
  it("passes all gates for a healthy result", () => {
    expect(allGatesPass(evaluateGates(passingResult))).toBe(true);
  });

  it("fails the dashboard p95 gate when slow", () => {
    const result: LoadResult = {
      ...passingResult,
      dashboard: { ...passingResult.dashboard!, p95: 900 },
    };
    const verdicts = evaluateGates(result);
    const gate = verdicts.find((v) => v.scenario === "dashboard" && v.metric === "p95");
    expect(gate?.pass).toBe(false);
    expect(allGatesPass(verdicts)).toBe(false);
  });

  it("fails the errors gate when error rate is high", () => {
    const result: LoadResult = {
      ...passingResult,
      browse: { ...passingResult.browse!, errors: 3.5 },
    };
    const verdicts = evaluateGates(result);
    const gate = verdicts.find((v) => v.scenario === "browse" && v.metric === "errors");
    expect(gate?.pass).toBe(false);
  });

  it("skips gates for scenarios that never ran (CI smoke)", () => {
    const result: LoadResult = { browse: passingResult.browse };
    const verdicts = evaluateGates(result);
    expect(allGatesPass(verdicts)).toBe(true);
    const searchGate = verdicts.find((v) => v.scenario === "search");
    expect(searchGate?.skipped).toBe(true);
    const browseGate = verdicts.find((v) => v.scenario === "browse");
    expect(browseGate?.skipped).toBeUndefined();
  });
});

describe("gateSuggestions", () => {
  it("returns a success message when everything passes", () => {
    expect(gateSuggestions(evaluateGates(passingResult))[0]).toContain("پاس");
  });

  it("points at the replica for slow dashboard", () => {
    const result: LoadResult = {
      ...passingResult,
      dashboard: { ...passingResult.dashboard!, p95: 1200 },
    };
    const suggestions = gateSuggestions(evaluateGates(result));
    expect(suggestions.join(" ")).toContain("replica");
  });

  it("points at Meilisearch for slow search", () => {
    const result: LoadResult = {
      ...passingResult,
      search: { ...passingResult.search!, p95: 800 },
    };
    const suggestions = gateSuggestions(evaluateGates(result));
    expect(suggestions.join(" ")).toContain("Meilisearch");
  });
});

describe("analyzeLoad", () => {
  it("returns a coherent report for a healthy result", () => {
    const report = analyzeLoad(passingResult);
    expect(report.pass).toBe(true);
    expect(report.verdicts).toHaveLength(LOAD_GATES.length);
    expect(report.suggestions[0]).toContain("پاس");
  });

  it("returns failure + suggestions for a slow result", () => {
    const report = analyzeLoad({
      ...passingResult,
      browse: { ...passingResult.browse!, p95: 900 },
    });
    expect(report.pass).toBe(false);
    expect(report.suggestions.length).toBeGreaterThan(0);
  });
});

describe("fixtures (real k6 result.json shape)", () => {
  const fixture = (name: string): LoadResult =>
    JSON.parse(
      readFileSync(resolve(__dirname, `../../../scripts/load/fixtures/${name}.json`), "utf8"),
    ) as LoadResult;

  it("pass.json passes all gates", () => {
    expect(analyzeLoad(fixture("pass")).pass).toBe(true);
  });

  it("fail.json fails the dashboard gate with a replica suggestion", () => {
    const report = analyzeLoad(fixture("fail"));
    expect(report.pass).toBe(false);
    expect(report.suggestions.join(" ")).toContain("replica");
  });

  it("smoke.json (browse-only CI) passes with search skipped", () => {
    const report = analyzeLoad(fixture("smoke"));
    expect(report.pass).toBe(true);
    expect(report.verdicts.filter((v) => v.skipped)).toHaveLength(4); // search + dashboard gates
  });
});
