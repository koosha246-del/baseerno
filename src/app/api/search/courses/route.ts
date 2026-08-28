import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";
import { withRateLimit } from "@/lib/api-middleware";
import { getOrSet } from "@/lib/cache";
import { incr } from "@/lib/metrics";

/**
 * Public course search — no auth required.
 *
 * Backs the header autocomplete for anonymous visitors. Only published
 * courses are returned (searchCourses filters `published = true` in its
 * Meilisearch filter and FTS/LIKE fallbacks).
 *
 * Shape matches what PublicSearch.tsx expects: `{ results: [{id,title,subtitle}] }`.
 */
async function publicCourseSearchHandler(req: Request) {
  const { searchParams } = new URL(req.url);
  // Cap length BEFORE caching/lookup — unbounded q would mint unbounded
  // Redis/unstable_cache keys on this anonymous endpoint.
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
  // Math.floor: Prisma `take` and SQL LIMIT are integers — a float like
  // ?take=2.5 would throw PrismaClientValidationError → 500.
  const rawTake = Number.parseInt(searchParams.get("take") ?? "5", 10);
  const take = Math.min(Math.max(Number.isNaN(rawTake) ? 5 : rawTake, 1), 10);

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  incr("search:public-query");

  // Cache 60s — same rationale as /api/search: keystroke autocomplete
  // shouldn't hammer the index; tagged `courses` so mutations bust it.
  const courses = await getOrSet(
    `search:public-courses:${q.toLowerCase()}:${take}`,
    60,
    () => repository.searchCourses(q, take),
    ["courses"],
  );

  return NextResponse.json({
    results: courses.map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
    })),
  });
}

/**
 * Search-specific preset: autocomplete fires per keystroke (300ms debounce)
 * and this endpoint is public, so 120/min + burst 15 keeps legit visitors
 * unblocked while still bounding abuse.
 */
export const GET = withRateLimit(
  publicCourseSearchHandler,
  { windowMs: 60_000, max: 120, burst: 15, burstWindowMs: 5_000 },
  { keyPrefix: "search:public" },
);
