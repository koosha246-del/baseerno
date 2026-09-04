import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { snapshotMetrics } from "@/lib/metrics";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

/**
 * GET /api/metrics — operational metrics snapshot (ADMIN only).
 *
 * Body counters reset after each scrape so in-memory state stays
 * bounded; histogram windows rotate via the per-key caps in
 * src/lib/metrics.ts.
 */
export const dynamic = "force-dynamic";

async function metricsHandler() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }

  // reset=true clears counters after the snapshot to bound memory.
  const snapshot = snapshotMetrics(true);
  return NextResponse.json(snapshot);
}

/**
 * READ per-minute cap. Each scrape RESETS the counters, so unbounded
 * scrapes would let one client deny every other consumer a complete
 * window; ADMIN is already required.
 */
export const GET = withRateLimit(metricsHandler, RATE_LIMIT_PRESETS.READ, {
  keyPrefix: "metrics",
});
