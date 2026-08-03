/**
 * Live end-to-end drill for the search sync loop (گام ۳ تکمیلی).
 *
 * Proves the exact contract the course mutation routes now rely on:
 *   update course → publish({type:"search:needs-sync"}) → events.ts handler
 *   calls syncCourseSearch(courseId) → FTS row + Meilisearch doc refreshed
 *   → searchCourses() returns the FRESH title.
 *
 * Flow (throwaway course, cleaned up on exit):
 *   1. Create a course with a unique marker in the title (OLD marker).
 *   2. Publish the event → search for the marker → hit.
 *   3. Update the title to a DIFFERENT unique marker (NEW marker — the two
 *      markers are mutually exclusive words, so a real negative check is
 *      possible).
 *   4. Publish the event again (exactly what PATCH /api/courses/[id] now
 *      does) → search for the NEW marker → hit (fresh!).
 *   5. Negative: the OLD marker no longer matches the indexed doc.
 *   6. Unpublish (soft delete — what DELETE + admin moderate do) → publish
 *      the event again → search must NOT return the course at all.
 *   7. Re-publish → publish the event → the course is searchable again
 *      (round-trip through the publish lifecycle).
 *   8. Unpublish WITHOUT firing the event — the exact gap that can happen
 *      when an event publish fails. The stale FTS row / indexed doc (with
 *      published: true) must STILL be findable, documenting why the bulk
 *      self-healing below exists.
 *   9. Bulk sync (no courseId — exactly what the 6-hour cron runs) → the
 *      orphan must be purged: search no longer returns the course.
 *  10. Cleanup: delete the course row, its CourseSearch row, and the
 *      Meilisearch doc.
 *
 * COVERAGE NOTE: the cron route (/api/cron/search-sync) calls
 * syncCourseSearch() directly, which is exactly what this drill exercises
 * via the event — the secret-header gate + GET/POST alias are HTTP-layer
 * concerns outside this drill's scope.
 *
 * NOTE on Meilisearch eventual consistency: indexCourses() POSTs documents
 * and returns without awaiting the async task, so the fresh-search checks
 * poll for up to ~6s before failing.
 *
 * Modes (mirroring verify-search.ts):
 *   index    → SEARCH_HOST + SEARCH_API_KEY set — exercises Meilisearch.
 *   fallback → SEARCH_* stripped from the env — exercises Postgres FTS.
 *
 * Usage:
 *   npm run verify:search:sync:index
 *   npm run verify:search:sync:fallback
 */
import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";

/** Minimal .env loader — dev convenience; exported vars always win. */
function loadDotEnv(): void {
  try {
    if (!existsSync(".env")) return;
    const content = readFileSync(".env", "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]!]) {
        process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // best-effort
  }
}

loadDotEnv();

const mode = process.argv[2] ?? "index";

// Fallback mode must NOT see the dedicated engine — same as verify-search.ts.
if (mode === "fallback") {
  delete process.env.SEARCH_HOST;
  delete process.env.SEARCH_API_KEY;
}

let failures = 0;
function check(label: string, ok: boolean): void {
  console.log(` ${ok ? "✅" : "❌"} ${label}`);
  if (!ok) failures++;
}

/** Poll searchCourses until a predicate holds or ~6s elapse. */
async function pollSearch(
  searchCourses: (q: string, limit?: number) => Promise<Array<{ id: string; title: string }>>,
  query: string,
  predicate: (hit: { id: string; title: string } | undefined) => boolean,
): Promise<{ hit: { id: string; title: string } | undefined; waitedMs: number }> {
  const deadline = Date.now() + 6_000;
  let hit: { id: string; title: string } | undefined;
  do {
    const results = await searchCourses(query, 10);
    hit = results.find((c) => c.id === courseIdRef);
    if (predicate(hit)) return { hit, waitedMs: 6_000 - (deadline - Date.now()) };
    await new Promise((r) => setTimeout(r, 250));
  } while (Date.now() < deadline);
  return { hit, waitedMs: 6_000 - (deadline - Date.now()) };
}

// Hoisted so the poll helper can find this run's course without re-passing it.
let courseIdRef: string | null = null;

async function main(): Promise<void> {
  console.log(`🔄 verify-search-sync — mode: ${mode}\n`);

  // Unique random stem + two MUTUALLY EXCLUSIVE markers, so the negative
  // check can actually detect staleness (old word ≠ new word).
  const stem = `همگامسازی${randomUUID().slice(0, 8)}`;
  const oldWord = `قرمز${stem}`;
  const newWord = `آبی${stem}`;
  const oldTitle = `دورهی آزمون ${oldWord}`;
  const newTitle = `دورهی آزمون ${newWord}`;

  // Dynamic imports so loadDotEnv() runs first (env.ts validates at import).
  const { prisma } = await import("@/lib/db/prisma-client");
  const { createCourse, updateCourse, unpublishCourse } = await import(
    "@/lib/db/domains/courses.repo"
  );
  const { searchCourses, syncCourseSearch } = await import(
    "@/lib/db/domains/search.repo"
  );
  const { publish } = await import("@/lib/events");
  const { deleteCourse } = await import("@/lib/search/client");

  const mentor = await prisma.user.findFirst({
    where: { role: "TEACHER" },
    select: { id: true },
  });
  check("a TEACHER mentor exists to own the throwaway course", mentor !== null);
  if (!mentor) process.exit(1);

  let courseId: string | null = null;
  try {
    // ── 1. Create ────────────────────────────────────────────────
    const course = await createCourse({
      title: oldTitle,
      subtitle: `زیرعنوان آزمون ${oldWord}`,
      description: `توضیح کامل آزمون همگامسازی ${oldWord} برای drill زنده.`,
      price: 0,
      level: "مقدماتی",
      category: "تست",
      durationHours: 1,
      lessons: 1,
      glyph: "🧪",
      accent: "blue",
      published: true,
      mentorId: mentor.id,
    });
    courseId = course.id;
    courseIdRef = course.id;
    check(`created throwaway course ${course.id}`, true);

    // ── 2. First publish → index seeded with OLD marker ──────────
    await publish({ type: "search:needs-sync", courseId: course.id });
    const first = await pollSearch(searchCourses, oldWord, (h) => h !== undefined);
    check(
      `event #1 → search finds the course (title: "${first.hit?.title}")`,
      first.hit !== undefined && first.hit.title.includes(oldWord),
    );

    // ── 3. Update title to a NEW marker ──────────────────────────
    await updateCourse(course.id, { title: newTitle });
    check("course title updated in DB", true);

    // ── 4. Second publish (what PATCH now does) → FRESH search ───
    await publish({ type: "search:needs-sync", courseId: course.id });
    const fresh = await pollSearch(searchCourses, newWord, (h) => h?.title === newTitle);
    check(
      `event #2 → search returns the NEW title ("${fresh.hit?.title}", waited ${fresh.waitedMs}ms)`,
      fresh.hit !== undefined && fresh.hit.title === newTitle,
    );

    // ── 5. Negative: the OLD marker must no longer match ─────────
    const stale = await pollSearch(searchCourses, oldWord, (h) => h === undefined || h.title === newTitle);
    const staleOk = stale.hit === undefined || stale.hit.title === newTitle;
    check(
      `old marker no longer matches the indexed doc (got: "${stale.hit?.title ?? "no hit"}", waited ${stale.waitedMs}ms)`,
      staleOk,
    );

    // ── 6. Unpublish (soft delete) → search must drop the course ─
    await unpublishCourse(course.id);
    await publish({ type: "search:needs-sync", courseId: course.id });
    const gone = await pollSearch(searchCourses, newWord, (h) => h === undefined);
    check(
      `event #3 (unpublish) → search no longer returns the course (waited ${gone.waitedMs}ms)`,
      gone.hit === undefined,
    );

    // ── 7. Re-publish → event → searchable again (round-trip) ────
    await prisma.course.update({
      where: { id: course.id },
      data: { published: true },
    });
    await publish({ type: "search:needs-sync", courseId: course.id });
    const back = await pollSearch(searchCourses, newWord, (h) => h?.title === newTitle);
    check(
      `event #4 (re-publish) → course is searchable again (waited ${back.waitedMs}ms)`,
      back.hit !== undefined && back.hit.title === newTitle,
    );

    // ── 8. Unpublish WITHOUT the event → the orphan gap ──────────
    // This is the exact failure mode the bulk self-healing below exists
    // to close: if an event publish fails, the stale FTS row / indexed
    // doc (published: true) survives — and is still findable.
    await unpublishCourse(course.id);
    const orphan = await pollSearch(searchCourses, newWord, (h) => h !== undefined);
    check(
      `unpublish without event → stale entry still findable (gap documented, waited ${orphan.waitedMs}ms)`,
      orphan.hit !== undefined,
    );

    // ── 9. Bulk sync (what the 6-hour cron runs) → self-heals ────
    await syncCourseSearch(); // no courseId → bulk purge + rebuild
    const healed = await pollSearch(searchCourses, newWord, (h) => h === undefined);
    check(
      `bulk sync purges the orphan → course gone (waited ${healed.waitedMs}ms)`,
      healed.hit === undefined,
    );
  } finally {
    // ── 10. Cleanup: course row + CourseSearch row + Meili doc ───
    if (courseId) {
      await prisma.course
        .delete({ where: { id: courseId } })
        .catch(() => undefined);
      await prisma.$executeRawUnsafe(
        `DELETE FROM "CourseSearch" WHERE id = $1`,
        courseId,
      );
      await deleteCourse(courseId).catch(() => undefined);
      console.log(`🧹 cleaned up ${courseId}`);
    }
    await prisma.$disconnect();
  }

  console.log("");
  if (failures > 0) {
    console.error(`❌ ${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("🎉 All search-sync checks passed.");
}

main().catch((e) => {
  console.error("verify-search-sync crashed:", e);
  process.exit(1);
});
