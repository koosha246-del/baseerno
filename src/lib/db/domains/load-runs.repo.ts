/**
 * Load-runs domain — persists k6 load-test results so the Ops dashboard
 * can chart p95 / error trends over time (see model LoadRun).
 *
 * `scenarios` mirrors the shape of the k6 result.json written by
 * scripts/load/k6-script.js:
 *   { browse: {p50,p95,p99,avg,errors}, search: {...}, dashboard: {...} }
 */
import { prisma } from "../prisma-client";
import type { LoadResult, ScenarioStats } from "@/lib/load-analysis";

export interface LoadRunInput {
  baseUrl: string;
  vus: number;
  durationSeconds: number;
  pass: boolean;
  scenarios: Partial<Record<"browse" | "search" | "auth" | "dashboard", ScenarioStats>>;
  cacheHits: number;
}

/** Persist one load-test run (from the k6 result). */
export async function recordLoadRun(input: LoadRunInput): Promise<void> {
  await prisma.loadRun.create({
    data: {
      baseUrl: input.baseUrl,
      vus: input.vus,
      durationSeconds: input.durationSeconds,
      pass: input.pass,
      scenarios: input.scenarios as object,
      cacheHits: input.cacheHits,
    },
  });
}

/**
 * Recent load runs, newest first — for the Ops trend chart.
 * `offset` enables cursor-less pagination for the archive page.
 */
export async function listLoadRuns(
  take = 30,
  offset = 0,
): Promise<
  Array<{
    id: string;
    baseUrl: string;
    vus: number;
    durationSeconds: number;
    pass: boolean;
    scenarios: unknown;
    cacheHits: number;
    createdAt: Date;
  }>
> {
  return prisma.loadRun.findMany({
    orderBy: { createdAt: "desc" },
    take,
    skip: offset,
  });
}

/** Shape helper for chart data — validated by load-analysis on the way in. */
export function isLoadResult(v: unknown): v is LoadResult {
  const r = v as LoadResult;
  return (
    typeof r === "object" &&
    r !== null &&
    typeof r.baseUrl === "string" &&
    typeof r.vus === "number" &&
    (r.browse === undefined || typeof r.browse.p95 === "number") &&
    (r.search === undefined || typeof r.search.p95 === "number") &&
    (r.dashboard === undefined || typeof r.dashboard.p95 === "number")
  );
}
