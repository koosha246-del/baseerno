/**
 * FTS migration — creates the CourseSearch table and populates it.
 *
 * Run this manually after the Prisma migration:
 *   npx tsx prisma/seed-fts.ts
 *
 * Or via the API:
 *   curl -X POST /api/admin/search-sync
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

async function main() {
  const adapter = new PrismaPg({
    connectionString: withUtcSession(process.env.DATABASE_URL ?? ""),
  });
  const prisma = new PrismaClient({ adapter });
  console.log("🌱 Seeding CourseSearch table...");

  const courses = await prisma.course.findMany({
    where: { published: true },
    select: { id: true, title: true, subtitle: true },
  });

  for (const course of courses) {
    const searchText = `${course.title} ${course.subtitle}`;
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "CourseSearch" (id, title, subtitle, "searchVector")
      VALUES ($1, $2, $3, to_tsvector('simple', $4))
      ON CONFLICT (id)
      DO UPDATE SET title = $2, subtitle = $3, "searchVector" = to_tsvector('simple', $4)
    `,
      course.id,
      course.title,
      course.subtitle,
      searchText,
    );
  }

  console.log(`✅ Synced ${courses.length} courses to CourseSearch`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});