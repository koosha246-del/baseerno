import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { getOrSet } from "@/lib/cache";
import { incr } from "@/lib/metrics";

async function searchHandler(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Ops signal: one counter per real query (not per keystroke — empty
  // queries above return before this point).
  incr("search:query");

  // Course search is public data — cache the Meilisearch/FTS lookup for 60s
  // so every keystroke of the TopBar autocomplete (300ms debounce) doesn't
  // hammer the index. Tagged `courses` so course mutations bust the
  // unstable_cache layer; the Redis layer is TTL-only, so worst-case
  // staleness is 60s (acceptable for an autocomplete cache). Messages and
  // users are personal to the requester and are deliberately NOT cached.
  const [courses, messages, users] = await Promise.all([
    getOrSet(
      `search:courses:${q.toLowerCase()}`,
      60,
      () => repository.searchCourses(q, 5),
      ["courses"],
    ),
    repository.searchMessages(user.id, q, 5),
    user.role === "ADMIN" ? repository.searchUsers(q, 5) : Promise.resolve([]),
  ]);

  const results = [
    ...courses.map((c) => ({
      type: "course" as const,
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      link: `/dashboard/courses`,
    })),
    ...messages.map((m) => ({
      type: "message" as const,
      id: m.id,
      title: m.body.slice(0, 80) + (m.body.length > 80 ? "..." : ""),
      subtitle: new Date(m.sentAt).toLocaleDateString("fa-IR"),
      link: `/dashboard/messages`,
    })),
    ...users.map((u) => ({
      type: "user" as const,
      id: u.id,
      title: u.name,
      subtitle: u.email,
      link: `/dashboard/users`,
    })),
  ];

  return NextResponse.json({ results });
}

/**
 * Search-specific preset: higher than READ because the TopBar autocomplete
 * fires on every keystroke (300ms debounce) — a fast typist can exceed
 * 60 req/min. 120/min + burst 15 keeps legit users unblocked.
 */
export const GET = withRateLimit(
  searchHandler,
  { windowMs: 60_000, max: 120, burst: 15, burstWindowMs: 5_000 },
  { keyPrefix: "search" },
);