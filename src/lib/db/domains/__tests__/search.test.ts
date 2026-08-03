/**
 * Unit tests for src/lib/db/domains/search.repo.ts.
 *
 * Strategy: mock `@/lib/db/prisma-client` so we can simulate the
 * Postgres FTS path (`prisma.$queryRawUnsafe`), the empty-table
 * fallback, and the LIKE-fallback path (`course.findMany`).
 *
 * We avoid real PostgreSQL because the tests run in CI without a
 * database service (integration variants live in src/lib/__tests__/integration).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const ftsHits: Array<{ id: string; title: string; subtitle: string; rank: number }> = [
  { id: "c1", title: "گرامر پیشرفته", subtitle: "سطح C1", rank: 0.9 },
  { id: "c2", title: "مکالمه روزمره", subtitle: "سطح B1", rank: 0.6 },
];

const likeHits = [
  { id: "c1", title: "گرامر پیشرفته", subtitle: "سطح C1" },
  { id: "c2", title: "مکالمه روزمره", subtitle: "سطح B1" },
];

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

import { searchCourses } from "@/lib/db/domains/search.repo";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchCourses — FTS path", () => {
  it("returns ranked hits when tsquery matches", async () => {
    prisma.$queryRawUnsafe.mockResolvedValueOnce(ftsHits);
    const result = await searchCourses("گرامر", 10);
    expect(result).toEqual(ftsHits);
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    expect(prisma.course.findMany).not.toHaveBeenCalled();
  });

  it("falls back to LIKE when FTS returns no rows (empty table / genuine miss)", async () => {
    prisma.$queryRawUnsafe.mockResolvedValueOnce([]);
    prisma.course.findMany.mockResolvedValueOnce(likeHits as never);

    const result = await searchCourses("nothing-matches", 10);
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe("c1"); // fallback rows are returned as-is
    expect(prisma.course.findMany).toHaveBeenCalledOnce();
  });

  it("falls back to LIKE when the raw query throws (column missing, etc.)", async () => {
    prisma.$queryRawUnsafe.mockRejectedValueOnce(new Error("column does not exist"));
    prisma.course.findMany.mockResolvedValueOnce(likeHits as never);

    const result = await searchCourses("گرامر");
    expect(result).toHaveLength(2);
  });

  it("returns recent published courses for short queries without hitting FTS", async () => {
    prisma.course.findMany.mockResolvedValueOnce([likeHits[0]] as never);

    const result = await searchCourses("م");
    expect(result).toHaveLength(1);
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { published: true } }),
    );
  });
});
