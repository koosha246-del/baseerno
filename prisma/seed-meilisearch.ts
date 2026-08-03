/**
 * Meilisearch seed — configure the course index with Persian-optimized
 * settings and index every published course.
 *
 * Prerequisites:
 *   1. Start Meilisearch:  docker compose up -d meilisearch
 *   2. Export SEARCH_HOST + SEARCH_API_KEY (see .env.example)
 *   3. (optional) A seeded database so there are courses to index
 *
 * Run:
 *   npm run seed:search
 *
 * The script also self-verifies: it searches a real course title (and a
 * deliberately-typoed variant) against the index and fails loudly if the
 * index does not return the expected hits.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma/client";
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

/** Swap two adjacent middle characters — a realistic Persian typo. */
function typoOf(word: string): string {
  if (word.length < 3) return word;
  const i = Math.floor(word.length / 2) - 1;
  const chars = word.split("");
  [chars[i], chars[i + 1]] = [chars[i + 1]!, chars[i]!];
  return chars.join("");
}

async function main() {
  // Dynamic import ON PURPOSE: static imports are hoisted above loadDotEnv()
  // in ESM, so env.ts would read process.env before .env is loaded. Importing
  // here guarantees SEARCH_HOST/SEARCH_API_KEY from .env are visible.
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

  if (!isSearchEnabled()) {
    console.error("❌ SEARCH_HOST/SEARCH_API_KEY not configured — cannot seed Meilisearch.");
    console.error("    Start it: docker compose up -d meilisearch");
    console.error("    Then set SEARCH_HOST + SEARCH_API_KEY in your env (see .env.example).");
    process.exit(1);
  }

  const up = await pingSearch();
  if (!up) {
    console.error(`❌ Meilisearch not reachable at ${process.env.SEARCH_HOST ?? "SEARCH_HOST"}`);
    process.exit(1);
  }
  console.log("✅ Meilisearch reachable");

  // 1) Apply Persian-optimized settings (typo tolerance, stop words...).
  const settingsTask = await configureCourseIndex(COURSE_INDEX_SETTINGS);
  if (settingsTask) {
    const status = await waitForSearchTask(settingsTask.taskUid);
    console.log(`⚙️  Index settings applied (task: ${status})`);
  }

  // 2) Load all published courses.
  const adapter = new PrismaPg({
    connectionString: withUtcSession(process.env.DATABASE_URL ?? ""),
  });
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

  if (courses.length === 0) {
    console.warn("⚠️  No published courses found — run `npm run db:seed` first.");
    await prisma.$disconnect();
    return;
  }

  // 3) Wipe and re-index (full rebuild so unpublished courses disappear).
  const clearTask = await clearCoursesIndex();
  if (clearTask) await waitForSearchTask(clearTask.taskUid);

  const docs = courses.map((c) => ({ ...c, published: true }));
  const indexTask = await indexCourses(docs);
  if (!indexTask) {
    console.error("❌ Failed to start the indexing task.");
    await prisma.$disconnect();
    process.exit(1);
  }
  const indexStatus = await waitForSearchTask(indexTask.taskUid);
  if (indexStatus !== "succeeded") {
    console.error(`❌ Indexing task failed (${indexStatus}).`);
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`✅ Indexed ${docs.length} courses into "courses"`);

  // 4) Self-verify: exact match + typo tolerance on a real title.
  const sample = courses[0]!;
  const word = (sample.title.split(" ")[0] ?? sample.title).trim();
  const typo = typoOf(word);

  const exact = await searchCoursesIndex(word, 3);
  const exactHit = exact?.hits.some((h) => h.id === sample.id) ?? false;
  if (!exactHit) {
    console.error(`❌ Exact search for "${word}" did not return course ${sample.id}.`);
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`✅ Exact search "${word}" → hit (course ${sample.id})`);

  if (typo !== word && word.length >= 4) {
    const typoRes = await searchCoursesIndex(typo, 3);
    const typoHit = typoRes?.hits.some((h) => h.id === sample.id) ?? false;
    if (!typoHit) {
      console.error(`❌ Typo search "${typo}" did not return course ${sample.id}.`);
      await prisma.$disconnect();
      process.exit(1);
    }
    console.log(`✅ Persian typo tolerance "${typo}" → hit (course ${sample.id})`);
  } else {
    console.log(`ℹ️  Skipped typo check (word too short: "${word}")`);
  }

  await prisma.$disconnect();
  console.log("🎉 Meilisearch seed complete.");
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
