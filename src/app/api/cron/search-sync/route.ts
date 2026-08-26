/**
 * Cron Job: re-sync the search indexes (Postgres FTS + Meilisearch).
 *
 * Triggered by Vercel Cron Jobs (cron: "0 *\/6 * * *") or by a Railway
 * scheduler / external cron hitting this path with the secret header.
 *
 * syncCourseSearch() upserts the tsvector rows AND mirrors documents into
 * the dedicated Meilisearch index when SEARCH_HOST is configured — so this
 * single endpoint keeps both layers fresh.
 *
 * Protected by the same x-cron-secret header as the email cron.
 */
import { NextResponse } from "next/server";
import { syncCourseSearch } from "@/lib/db/domains/search.repo";
import { env } from "@/lib/env";
import { timingSafeEqual } from "node:crypto";

export const maxDuration = 300; // 5 minutes
export const dynamic = "force-dynamic";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Accepts the secret via either:
 *  - `x-cron-secret: <secret>` (external schedulers / curl)
 *  - `Authorization: Bearer <secret>` (Vercel managed cron can only send this)
 */
function extractProvidedSecret(req: Request): string | null {
  const header = req.headers.get("x-cron-secret");
  if (header) return header;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return null;
}

export async function POST(req: Request) {
  // Protect the cron endpoint with a secret. Fail CLOSED: if
  // CRON_SECRET is not configured, the endpoint refuses to run instead of
  // letting anyone trigger a full search re-sync.
  const provided = extractProvidedSecret(req);
  const expected = env.CRON_SECRET;
  if (!expected || !provided || !safeCompare(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional courseId — re-syncs a single course instead of everything.
  let body: { courseId?: string } = {};
  try {
    body = await req.json();
  } catch {
    // no body — full re-sync
  }

  const synced = await syncCourseSearch(body.courseId);

  return NextResponse.json({
    ok: true,
    synced,
    scope: body.courseId ?? "all",
    timestamp: new Date().toISOString(),
  });
}

// GET alias — some cron schedulers (e.g. plain HTTP pings) only send GET.
export async function GET(req: Request) {
  return POST(req);
}
