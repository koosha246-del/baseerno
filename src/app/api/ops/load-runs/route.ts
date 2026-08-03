import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import type { LoadResult } from "@/lib/load-analysis";

export const dynamic = "force-dynamic";

/**
 * GET /api/ops/load-runs — load-test history (ADMIN only).
 *
 * Query params:
 *   ?limit=50      rows to return (default 30, max 200)
 *   ?offset=50     skip the first N rows (pagination for the archive)
 *   ?format=csv    emit a CSV download instead of JSON
 *
 * Each row: { id, createdAt, baseUrl, vus, durationSeconds, pass,
 *             cacheHits, scenarios: {browse?, search?, auth?, dashboard?} }
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rawLimit = Number(searchParams.get("limit") ?? 30);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, rawLimit), 200) : 30;
  const rawOffset = Number(searchParams.get("offset") ?? 0);
  const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;

  const runs = await repository.listLoadRuns(limit, offset);

  if (searchParams.get("format") === "csv") {
    return csvResponse(runs);
  }

  return NextResponse.json({ runs });
}

/** Build the CSV download response from load runs. */
function csvResponse(
  runs: Awaited<ReturnType<typeof repository.listLoadRuns>>,
): NextResponse {
  const header = [
    "createdAt",
    "baseUrl",
    "vus",
    "durationSeconds",
    "pass",
    "cacheHits",
    "browseP95",
    "searchP95",
    "dashboardP95",
    "browseErrors",
    "searchErrors",
    "dashboardErrors",
  ];

  const rows = runs.map((run) => {
    const s = run.scenarios as Partial<LoadResult> | null;
    const esc = (v: unknown) => {
      const str = String(v ?? "");
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    return [
      run.createdAt.toISOString(),
      run.baseUrl,
      run.vus,
      run.durationSeconds,
      run.pass ? "pass" : "fail",
      run.cacheHits,
      s?.browse?.p95 ?? "",
      s?.search?.p95 ?? "",
      s?.dashboard?.p95 ?? "",
      s?.browse?.errors ?? "",
      s?.search?.errors ?? "",
      s?.dashboard?.errors ?? "",
    ]
      .map(esc)
      .join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="load-runs.csv"',
    },
  });
}
