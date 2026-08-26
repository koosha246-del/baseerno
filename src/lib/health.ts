/**
 * Health report — liveness + dependency health for deploy platforms
 * (Vercel/Railway healthcheck, k8s probes, uptime monitors) and the
 * admin Ops dashboard (/dashboard/ops).
 *
 * Returns 200-level `status: "ok"` when the app + database are up;
 * `"degraded"` when a critical dependency is down. Non-critical
 * degradations (Redis/search) are reported but do not fail the health —
 * the app still serves.
 */
import { prismaRaw } from "@/lib/db/prisma-client";
import { getRedisClient } from "@/lib/redis-client";
import { isSearchEnabled, pingSearch } from "@/lib/search/client";
import { isTracingEnabled } from "@/lib/tracing";

export interface HealthReport {
  status: "ok" | "degraded";
  service: string;
  checks: Record<string, string>;
  timestamp: string;
}

/** True when the DB round-trip succeeded. */
export async function checkDatabase(): Promise<boolean> {
  try {
    await prismaRaw.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/** "ok" | "down" | "not_configured" for the optional Redis dependency. */
export async function checkRedis(): Promise<"ok" | "down" | "not_configured"> {
  try {
    const client = await getRedisClient();
    if (!client) return "not_configured";
    await client.ping();
    return "ok";
  } catch {
    return "down";
  }
}

/** "ok" | "down" | "not_configured" for the optional search engine. */
export async function checkSearch(): Promise<"ok" | "down" | "not_configured"> {
  if (!isSearchEnabled()) return "not_configured";
  return (await pingSearch()) ? "ok" : "down";
}

/** Pending email-outbox backlog count (informational). */
export async function emailOutboxBacklog(): Promise<string> {
  try {
    const pending = await prismaRaw.emailOutbox.count({
      where: { status: "pending" },
    });
    return pending > 100 ? `${pending} (high)` : `${pending}`;
  } catch {
    return "unknown";
  }
}

/** Full dependency health report — used by /api/health and the Ops page. */
export async function getHealthReport(): Promise<HealthReport> {
  const checks: Record<string, string> = {};

  checks.db = (await checkDatabase()) ? "ok" : "down";
  checks.redis = await checkRedis();
  checks.search = await checkSearch();
  checks.emailOutboxBacklog = await emailOutboxBacklog();
  checks.tracing = isTracingEnabled() ? "enabled" : "disabled";

  const healthy = checks.db === "ok";
  const degraded = checks.redis === "down" || checks.search === "down";

  return {
    status: healthy ? (degraded ? "degraded" : "ok") : "degraded",
    service: "baseer-no",
    checks,
    timestamp: new Date().toISOString(),
  };
}
