/**
 * End-to-end verification of the dedicated search stack (Meilisearch).
 *
 *   npm run verify:search             → index mode, then fallback mode
 *   npm run verify:search:index       → dedicated index must return hits
 *   npm run verify:search:fallback    → Postgres FTS/LIKE fallback must return hits
 *
 * Environment:
 *   index mode     → SEARCH_HOST + SEARCH_API_KEY + DATABASE_URL
 *   fallback mode  → DATABASE_URL only (SEARCH_* are stripped from the env)
 */
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { withUtcSession } from "../src/lib/db/conn";

/** Minimal .env loader — dev convenience; exported vars always win. */
function loadDotEnv(): void {
  try {
    const content = readFileSync(".env", "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]!]) {
        process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env file — rely on the exported environment.
  }
}

loadDotEnv();

const mode = process.argv[2] ?? "index";

let failures = 0;
function check(label: string, ok: boolean): void {
  console.log(`${ok ? "✅" : "❌"} ${label}`);
  if (!ok) failures++;
}

/** Swap two adjacent middle characters — a realistic Persian typo. */
function typoOf(word: string): string {
  if (word.length < 3) return word;
  const i = Math.floor(word.length / 2) - 1;
  const chars = word.split("");
  [chars[i], chars[i + 1]] = [chars[i + 1]!, chars[i]!];
  return chars.join("");
}

async function verifyIndexMode(): Promise<void> {
  const {
    COURSE_INDEX_SETTINGS,
    clearCoursesIndex,
    configureCourseIndex,
    indexCourses,
    isSearchEnabled,
    pingSearch,
    searchCoursesIndex,
    waitForSearchTask,
  } = await import("@/lib/search/client");
  const { PrismaClient } = await import("../src/generated/prisma/client");
  const adapter = new PrismaPg({
    connectionString: withUtcSession(process.env.DATABASE_URL ?? ""),
  });

  check("search is enabled (SEARCH_HOST + SEARCH_API_KEY)", isSearchEnabled());

  const up = await pingSearch();
  check("Meilisearch /health responds", up);

  const settingsTask = await configureCourseIndex(COURSE_INDEX_SETTINGS);
  if (settingsTask) {
    const st = await waitForSearchTask(settingsTask.taskUid);
    check(`index settings applied (${st})`, st === "succeeded");
  }

  const prisma = new PrismaClient({ adapter });
  const courses = await prisma.course.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      subtitle: true,
      category: true,
      level: true,
      price: true,
    },
  });
  await prisma.$disconnect();

  if (courses.length === 0) {
    console.warn("⚠️  No published courses — run `npm run db:seed` first. Skipping index assertions.");
    return;
  }

  // Full rebuild: wipe, then index what's published now.
  const clearTask = await clearCoursesIndex();
  if (clearTask) await waitForSearchTask(clearTask.taskUid);

  const docs = courses.map((c) => ({ ...c, published: true }));
  const indexTask = await indexCourses(docs);
  const iStatus = indexTask ? await waitForSearchTask(indexTask.taskUid) : "none";
  check(`indexed ${docs.length} courses (task: ${iStatus})`, iStatus === "succeeded");

  // Exact match + typo tolerance against the dedicated index.
  const sample = courses[0]!;
  const word = (sample.title.split(" ")[0] ?? sample.title).trim();
  const exact = await searchCoursesIndex(word, 5);
  const exactHit = exact?.hits.some((h) => h.id === sample.id) ?? false;
  check(`exact search "${word}" hits course ${sample.id}`, exactHit);

  const typo = typoOf(word);
  if (typo !== word && word.length >= 4) {
    const typoRes = await searchCoursesIndex(typo, 5);
    const typoHit = typoRes?.hits.some((h) => h.id === sample.id) ?? false;
    check(`Persian typo tolerance "${typo}" hits course ${sample.id}`, typoHit);
  } else {
    console.log(`ℹ️  Skipped typo check (word too short: "${word}")`);
  }
}

async function verifyFallbackMode(): Promise<void> {
  // Strip SEARCH_* before ANY module that reads env is imported, so the
  // app genuinely runs on the Postgres FTS/LIKE fallback path.
  delete process.env.SEARCH_HOST;
  delete process.env.SEARCH_API_KEY;

  const { searchCourses, syncCourseSearch } = await import("@/lib/db/domains/search.repo");
  const { PrismaClient } = await import("../src/generated/prisma/client");
  const adapter = new PrismaPg({
    connectionString: withUtcSession(process.env.DATABASE_URL ?? ""),
  });

  const prisma = new PrismaClient({ adapter });
  const courses = await prisma.course.findMany({
    where: { published: true },
    select: { id: true, title: true },
  });
  await prisma.$disconnect();

  if (courses.length === 0) {
    console.warn("⚠️  No published courses — run `npm run db:seed` first. Skipping fallback assertions.");
    return;
  }

  // Populate the tsvector table (if the migration ran); a failure here is
  // fine — searchCourses still degrades to the LIKE path.
  try {
    await syncCourseSearch();
  } catch (err) {
    console.warn("⚠️  CourseSearch sync failed (is the migration applied?):", err);
  }

  const sample = courses[0]!;
  const word = (sample.title.split(" ")[0] ?? sample.title).trim();
  const rows = await searchCourses(word, 5);
  const hit = rows.some((r) => r.id === sample.id);
  check(`FTS/LIKE fallback returns course ${sample.id} for "${word}"`, hit);
  console.log(`ℹ️  fallback returned ${rows.length} row(s) from Postgres (search index disabled)`);
}

async function main(): Promise<void> {
  console.log(`🔎 verify-search — mode: ${mode}\n`);
  if (mode === "index") {
    await verifyIndexMode();
  } else if (mode === "fallback") {
    await verifyFallbackMode();
  } else {
    console.error(`Unknown mode: ${mode} (expected "index" | "fallback")`);
    process.exit(2);
  }
  console.log("");
  if (failures > 0) {
    console.error(`❌ ${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("🎉 All search checks passed.");
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
