import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { snapshotMetrics } from "@/lib/metrics";

/**
 * GET /api/metrics — operational metrics snapshot (ADMIN only).
 *
 * Body counters reset after each scrape so in-memory state stays
 * bounded; histogram windows rotate via the per-key caps in
 * src/lib/metrics.ts.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }

  // reset=true clears counters after the snapshot to bound memory.
  const snapshot = snapshotMetrics(true);
  return NextResponse.json(snapshot);
}
