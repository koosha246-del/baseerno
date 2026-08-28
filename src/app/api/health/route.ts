import { NextResponse } from "next/server";
import { getHealthReport } from "@/lib/health";

/**
 * GET /api/health — liveness + dependency health for deploy platforms
 * (Vercel/Railway healthcheck, k8s probes, uptime monitors).
 *
 * Returns 200 when the app + database are up; 503 when a critical
 * dependency is down. Non-critical degradations (Redis/search) are
 * reported but do not fail the healthcheck — the app still serves.
 *
 * Logic lives in src/lib/health.ts so the admin Ops dashboard
 * (/dashboard/ops) reuses the exact same checks.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const report = await getHealthReport();
  // Liveness is defined by the DATABASE only. A Redis/search outage sets
  // the overall status to "degraded" (visible in the body / Ops page) but
  // the app still serves — failing the probe here would make monitors
  // restart a fully functional instance.
  const alive = report.checks.db === "ok";
  return NextResponse.json(report, {
    status: alive ? 200 : 503,
  });
}
