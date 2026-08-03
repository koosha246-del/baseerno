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

export const maxDuration = 300; // 5 minutes
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cronSecret = req.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  if (expected && cronSecret !== expected) {
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
