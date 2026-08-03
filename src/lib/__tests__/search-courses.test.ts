import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ─────────────────────────────────────────────────────────
// Vitest hoists vi.mock() factories above const declarations — shared
// mocks must be created inside vi.hoisted().
const { prisma } = vi.hoisted(() => ({
  prisma: {
    course: { findMany: vi.fn() },
    message: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma-client", () => ({ prisma }));

// Import AFTER mocking so the module sees the mocks.
import { searchCourses, syncCourseSearch } from "../db/domains/search.repo";

describe("searchCourses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns recent published courses for empty/short queries without raw SQL", async () => {
    prisma.course.findMany.mockResolvedValue([{ id: "c1", title: "دوره", subtitle: "زیر" }]);

    const rows = await searchCourses("");

    expect(rows).toEqual([{ id: "c1", title: "دوره", subtitle: "زیر" }]);
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { published: true } }),
    );
  });

  it("uses Postgres FTS (tsquery) for queries of length >= 2", async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([
      { id: "c1", title: "دوره مکالمه", subtitle: "زیر" },
    ]);

    const rows = await searchCourses("مکالمه");

    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe("c1");
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledOnce();
    // The raw SQL must target the tsvector column declared in the schema.
    const sql = String(prisma.$queryRawUnsafe.mock.calls[0]?.[0]);
    expect(sql).toContain('"searchVector"');
    expect(sql).toContain("plainto_tsquery");
    // No LIKE fallback when FTS returns rows.
    expect(prisma.course.findMany).not.toHaveBeenCalled();
  });

  it("falls back to LIKE search when the CourseSearch table returns no rows", async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([]);
    prisma.course.findMany.mockResolvedValue([{ id: "c2", title: "دوره مکالمه", subtitle: "زیر" }]);

    const rows = await searchCourses("مکالمه");

    expect(rows).toEqual([{ id: "c2", title: "دوره مکالمه", subtitle: "زیر" }]);
    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          published: true,
          OR: [
            { title: { contains: "مکالمه", mode: "insensitive" } },
            { subtitle: { contains: "مکالمه", mode: "insensitive" } },
          ],
        },
      }),
    );
  });

  it("falls back to LIKE search when the raw query throws (table missing)", async () => {
    prisma.$queryRawUnsafe.mockRejectedValue(new Error('relation "CourseSearch" does not exist'));
    prisma.course.findMany.mockResolvedValue([{ id: "c3", title: "دوره", subtitle: "زیر" }]);

    const rows = await searchCourses("مکالمه");

    expect(rows).toEqual([{ id: "c3", title: "دوره", subtitle: "زیر" }]);
  });

  it("syncCourseSearch upserts the tsvector row for a published course", async () => {
    prisma.course.findMany.mockResolvedValue([
      { id: "c1", title: "دوره مکالمه", subtitle: "زیرعنوان", published: true },
    ]);
    prisma.$executeRawUnsafe.mockResolvedValue(1);

    const count = await syncCourseSearch("c1");

    expect(count).toBe(1);
    // syncCourseSearch mirrors the full indexed shape, not just id/title.
    expect(prisma.course.findMany).toHaveBeenCalledWith({
      where: { id: "c1" },
      select: {
        id: true,
        title: true,
        subtitle: true,
        category: true,
        level: true,
        price: true,
        published: true,
      },
    });
    const sql = String(prisma.$executeRawUnsafe.mock.calls[0]?.[0]);
    expect(sql).toContain('"searchVector"');
    expect(sql).toContain("to_tsvector('simple', $4)");
    expect(prisma.$executeRawUnsafe.mock.calls[0]?.[1]).toBe("c1");
  });

  it("syncCourseSearch deletes the FTS row for an unpublished course", async () => {
    prisma.course.findMany.mockResolvedValue([
      { id: "c1", title: "دوره مکالمه", subtitle: "زیرعنوان", published: false },
    ]);
    prisma.$executeRawUnsafe.mockResolvedValue(1);

    const count = await syncCourseSearch("c1");

    expect(count).toBe(1);
    // Unpublished courses must be REMOVED (fallback FTS has no published filter).
    const sql = String(prisma.$executeRawUnsafe.mock.calls[0]?.[0]);
    expect(sql).toContain('DELETE FROM "CourseSearch"');
    expect(prisma.$executeRawUnsafe.mock.calls[0]?.[1]).toBe("c1");
    expect(prisma.$executeRawUnsafe).toHaveBeenCalledTimes(1);
  });
});
