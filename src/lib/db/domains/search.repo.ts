/**
 * Search domain — full-text search across courses, messages, users.
 *
 * Uses PostgreSQL full-text search (tsvector + tsquery) for ranked,
 * indexed lookups instead of the old `LIKE '%...%'` scan.
 *
 * The `CourseSearch` table holds a pre-computed tsvector column
 * (populated via Prisma middleware or DB trigger) so searches are
 * O(log n) on the GIN index rather than O(n) sequential scans.
 */

import { prisma } from "../prisma-client";
import {
  isSearchEnabled,
  searchCoursesIndex,
  type IndexedCourse,
  type SearchHit,
} from "@/lib/search/client";

/**
 * Search published courses using the dedicated search index when
 * configured; otherwise falls back to Postgres FTS, then LIKE.
 *
 * Layered fallback (each layer catches its own failures):
 *  1. Meilisearch index (SEARCH_HOST/SEARCH_API_KEY set)
 *  2. Postgres tsvector (CourseSearch table)
 *  3. LIKE scan (always works)
 */
export async function searchCourses(query: string, limit = 10) {
  if (!query || query.length < 2) {
    // Fallback for empty/short queries — just list recent courses
    return prisma.course.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, subtitle: true },
    });
  }

  // ── Layer 1: dedicated search index (best relevance) ──────────
  if (isSearchEnabled()) {
    try {
      const result = await searchCoursesIndex(query, limit);
      if (result && result.hits.length > 0) {
        return result.hits.map((h: SearchHit) => ({
          id: h.id,
          title: h.title,
          subtitle: h.subtitle,
        }));
      }
    } catch {
      // Index down — fall through to Postgres FTS.
    }
  }

  // ── Layer 2: Postgres full-text search ─────────────────────────
  const sql = `
    SELECT id, title, subtitle
    FROM "CourseSearch"
    WHERE "searchVector" IS NOT NULL
      AND "searchVector" @@ plainto_tsquery('simple', $1)
    ORDER BY ts_rank("searchVector", plainto_tsquery('simple', $1)) DESC
    LIMIT $2
  `;

  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ id: string; title: string; subtitle: string }>
    >(sql, query, limit);

    // If the tsvector table is empty (not populated yet), fall back
    // to the LIKE-based search as a graceful degradation.
    if (rows.length === 0) {
      return fallbackSearchCourses(query, limit);
    }
    return rows;
  } catch {
    // Raw query failed (table/index missing) — fallback gracefully
    return fallbackSearchCourses(query, limit);
  }
}

/**
 * LIKE-based fallback for when the CourseSearch table isn't ready.
 */
async function fallbackSearchCourses(query: string, limit = 10) {
  return prisma.course.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { subtitle: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, subtitle: true },
  });
}

/**
 * Search messages by body content using Postgres FTS.
 */
export async function searchMessages(userId: string, query: string, limit = 10) {
  if (!query || query.length < 2) {
    return prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      take: limit,
      orderBy: { sentAt: "desc" },
      select: { id: true, body: true, senderId: true, receiverId: true, sentAt: true },
    });
  }

  try {
    const sql = `
      SELECT id, body, "senderId", "receiverId", "sentAt"
      FROM "Message"
      WHERE ("senderId" = $1 OR "receiverId" = $1)
        AND to_tsvector('simple', body) @@ plainto_tsquery('simple', $2)
      ORDER BY ts_rank(to_tsvector('simple', body), plainto_tsquery('simple', $2)) DESC
      LIMIT $3
    `;
    const rows = await prisma.$queryRawUnsafe<
      Array<{ id: string; body: string; senderId: string; receiverId: string; sentAt: Date }>
    >(sql, userId, query, limit);
    return rows;
  } catch {
    // Fallback for when FTS is not available (e.g. test env)
    return prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        body: { contains: query, mode: "insensitive" },
      },
      take: limit,
      orderBy: { sentAt: "desc" },
      select: { id: true, body: true, senderId: true, receiverId: true, sentAt: true },
    });
  }
}

/**
 * Search users by name or email using Postgres FTS.
 */
export async function searchUsers(query: string, limit = 10) {
  if (!query || query.length < 2) {
    return prisma.user.findMany({
      take: limit,
      select: { id: true, name: true, email: true, role: true },
    });
  }

  try {
    const sql = `
      SELECT id, name, email, role
      FROM "User"
      WHERE to_tsvector('simple', name || ' ' || email) @@ plainto_tsquery('simple', $1)
      ORDER BY ts_rank(to_tsvector('simple', name || ' ' || email), plainto_tsquery('simple', $1)) DESC
      LIMIT $2
    `;
    const rows = await prisma.$queryRawUnsafe<
      Array<{ id: string; name: string; email: string; role: string }>
    >(sql, query, limit);
    return rows;
  } catch {
    return prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: { id: true, name: true, email: true, role: true },
    });
  }
}

/** Map a fetched course row to the shape the search index expects. */
function toIndexedCourse(c: {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  level: string;
  price: number | null;
  published: boolean;
}): IndexedCourse {
  return {
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    category: c.category,
    level: c.level,
    price: c.price,
    published: c.published,
  };
}

/**
 * Populate the CourseSearch table from Course rows.
 * Run this after creating/updating a course, or as a one-time migration.
 *
 * Also mirrors documents into the dedicated search index when
 * SEARCH_HOST is configured (failures logged only, never thrown).
 *
 * Semantics:
 *  - Per-course (courseId): unpublished courses are REMOVED from the FTS
 *    table + index — the fallback FTS query has no `published` filter, so
 *    a leftover row would keep a deleted course findable forever. The
 *    indexed doc is updated incrementally.
 *  - Bulk (no courseId — the 6-hour cron): self-healing. FTS rows for
 *    courses that are no longer published are purged, and the index is
 *    rebuilt from scratch so a stale doc (e.g. a course unpublished
 *    through a path whose event publish failed) can't linger with
 *    `published: true`.
 */
export async function syncCourseSearch(courseId?: string) {
  const where = courseId ? { id: courseId } : { published: true };

  const courses = await prisma.course.findMany({
    where,
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

  const publishedCourses: Array<(typeof courses)[number]> = [];
  for (const course of courses) {
    if (!course.published) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "CourseSearch" WHERE id = $1`,
        course.id,
      );
      if (isSearchEnabled()) {
        try {
          const { deleteCourse } = await import("@/lib/search/client");
          await deleteCourse(course.id);
        } catch (err) {
          console.error("[search] Failed to remove course from index:", err);
        }
      }
      continue;
    }
    publishedCourses.push(course);

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

  // ── Index mirror ───────────────────────────────────────────────
  // Bulk mode rebuilds from scratch (clears first, so stale docs for
  // unpublished/hard-deleted courses can't survive); per-course mode
  // upserts incrementally. Failures are logged, never thrown.
  if (isSearchEnabled() && publishedCourses.length > 0) {
    try {
      const { clearCoursesIndex, indexCourses } = await import("@/lib/search/client");
      if (!courseId) {
        await clearCoursesIndex();
      }
      await indexCourses(publishedCourses.map(toIndexedCourse));
    } catch (err) {
      console.error("[search] Failed to mirror courses into index:", err);
    }
  }

  // ── Bulk-only: purge FTS orphans ───────────────────────────────
  // Rows whose course is no longer published (or was hard-deleted
  // without firing the event) must not stay findable via fallback FTS —
  // the fallback query has no `published` filter.
  if (!courseId) {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "CourseSearch" WHERE id NOT IN (SELECT id FROM "Course" WHERE published = true)`,
    );
  }

  return courses.length;
}
