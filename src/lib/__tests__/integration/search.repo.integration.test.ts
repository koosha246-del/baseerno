/**
 * Integration tests for the search domain against a REAL PostgreSQL.
 *
 * These self-skip when DATABASE_URL is absent (local dev), and run in CI
 * where the postgres service is provisioned (see .github/workflows/ci.yml).
 *
 * The `CourseSearch` table is managed by raw SQL (there is no Prisma
 * migration for it), so the test creates it idempotently in beforeAll.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("search.repo (integration, real Postgres)", () => {
  let prisma: typeof import("@/lib/db/prisma-client").prisma;
  let searchRepo: typeof import("@/lib/db/domains/search.repo");
  let teacherId = "";
  let courseId = "";

  beforeAll(async () => {
    // Lazy imports — never touch prisma when there's no DB to connect to.
    prisma = (await import("@/lib/db/prisma-client")).prisma;
    searchRepo = await import("@/lib/db/domains/search.repo");

    // The tsvector table is created by prisma/migrations/…_add_course_search,
    // but integration tests may run against a DB where it's not applied yet.
    // Mirror the migration's shape (column name: searchVector).
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CourseSearch" (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        "searchVector" tsvector
      )
    `);

    const unique = `it-${Date.now()}`;
    const teacher = await prisma.user.create({
      data: {
        id: `${unique}-teacher`,
        name: "مدرس تست",
        email: `${unique}-teacher@test.local`,
        passwordHash: "x",
        role: "TEACHER",
      },
    });
    teacherId = teacher.id;

    const course = await prisma.course.create({
      data: {
        id: `${unique}-course`,
        title: "دوره Zapodisocu جستجو",
        subtitle: "زیرعنوان Zapodisocu یکتا",
        description: "توضیح تستی برای جستجو",
        mentorId: teacherId,
        price: 0,
        level: "مقدماتی",
        category: "test",
        durationHours: 1,
        lessons: 2,
        glyph: "🎯",
        accent: "violet",
        published: true,
      },
    });
    courseId = course.id;
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`DELETE FROM "CourseSearch" WHERE id = '${courseId}'`);
    await prisma.course.deleteMany({ where: { id: courseId } });
    await prisma.user.deleteMany({ where: { id: teacherId } });
    await prisma.$disconnect();
  });

  it("returns the course via tsvector FTS when CourseSearch is populated", async () => {
    await searchRepo.syncCourseSearch(courseId);

    const rows = await searchRepo.searchCourses("Zapodisocu");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]!.id).toBe(courseId);
  });

  it("falls back to LIKE search when the CourseSearch table is empty", async () => {
    // Remove this course's FTS row → raw query returns 0 rows → graceful
    // LIKE fallback. (Scoped to the test row so a local dev DB is untouched.)
    await prisma.$executeRawUnsafe(`DELETE FROM "CourseSearch" WHERE id = '${courseId}'`);

    const rows = await searchRepo.searchCourses("Zapodisocu");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]!.id).toBe(courseId);
  });

  it("returns recent published courses for empty/short queries", async () => {
    const rows = await searchRepo.searchCourses("");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map((r) => r.id)).toContain(courseId);
  });
});
