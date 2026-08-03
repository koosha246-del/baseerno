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
  return NextResponse.json(report, {
    status: report.status === "ok" ? 200 : 503,
  });
}
