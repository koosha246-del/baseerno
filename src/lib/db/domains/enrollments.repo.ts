/**
 * Enrollments domain — enrollments + grades CRUD + aggregation queries.
 */
import { prisma } from "../prisma-client";

/* ─── Enrollments ──────────────────────────────────────────────── */

export async function listEnrollments(
  userId?: string,
  opts?: { take?: number; skip?: number },
) {
  return prisma.enrollment.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { enrolledAt: "desc" },
    take: opts?.take,
    skip: opts?.skip,
  });
}

export async function countEnrollmentsByStatus(): Promise<Record<string, number>> {
  const groups = await prisma.enrollment.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const out: Record<string, number> = { ACTIVE: 0, COMPLETED: 0, DROPPED: 0 };
  for (const g of groups) out[g.status] = g._count._all;
  return out;
}

export async function countEnrollments(
  opts?: {
    userId?: string;
    courseId?: string;
    status?: string;
  },
  db: typeof prisma = prisma,
): Promise<number> {
  return db.enrollment.count({
    where: {
      ...(opts?.userId ? { userId: opts.userId } : {}),
      ...(opts?.courseId ? { courseId: opts.courseId } : {}),
      ...(opts?.status
        ? { status: opts.status as "ACTIVE" | "COMPLETED" | "DROPPED" }
        : {}),
    },
  });
}

export async function countUniqueStudentsForCourses(courseIds: string[]): Promise<number> {
  if (courseIds.length === 0) return 0;
  // SQL COUNT(DISTINCT) — avoids materializing every enrollment row.
  const groups = await prisma.enrollment.groupBy({
    by: ["userId"],
    where: { courseId: { in: courseIds } },
  });
  return groups.length;
}

/**
 * Count enrollments per course in a single grouped query — avoids pulling
 * the entire enrollment table into memory. Returns a Map of courseId → count.
 */
export async function countEnrollmentsPerCourse(
  courseIds: string[],
): Promise<Map<string, number>> {
  if (courseIds.length === 0) return new Map();
  const groups = await prisma.enrollment.groupBy({
    by: ["courseId"],
    where: { courseId: { in: courseIds } },
    _count: { _all: true },
  });
  const out = new Map<string, number>();
  for (const g of groups) out.set(g.courseId, g._count._all);
  return out;
}

export async function listEnrollmentsForCourse(courseId: string) {
  return prisma.enrollment.findMany({ where: { courseId } });
}

export async function findEnrollment(userId: string, courseId: string) {
  return prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
}

export async function createEnrollment(input: {
  userId: string;
  courseId: string;
  progress?: number;
}) {
  return prisma.enrollment.create({
    data: {
      userId: input.userId,
      courseId: input.courseId,
      progress: input.progress ?? 0,
      status: "ACTIVE",
    },
  });
}

/** Count enrollments grouped by calendar month (raw SQL). */
export async function enrollmentsByMonth(db: typeof prisma = prisma) {
  // Label in SQL with to_char — a naive `timestamp` parsed by the pg driver
  // is reinterpreted in the Node process's local timezone, which shifts
  // buckets on any non-UTC host (e.g. Asia/Tehran reads "2025-12" for Jan).
  const rows = await db.$queryRaw<
    Array<{ month: string; count: bigint }>
  >`
    SELECT to_char("enrolledAt", 'YYYY-MM') AS month, COUNT(*)::bigint AS count
    FROM "Enrollment"
    WHERE "deletedAt" IS NULL
    GROUP BY to_char("enrolledAt", 'YYYY-MM')
    ORDER BY month ASC
  `;
  return rows.map((r) => ({
    month: r.month,
    count: Number(r.count),
  }));
}

/* ─── Grades ───────────────────────────────────────────────────── */

export async function listGrades(
  userId?: string,
  teacherId?: string,
  opts?: { take?: number; skip?: number },
) {
  return prisma.grade.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(teacherId ? { teacherId } : {}),
    },
    orderBy: { gradedAt: "desc" },
    take: opts?.take,
    skip: opts?.skip,
  });
}

export async function createGrade(input: {
  userId: string;
  courseId: string;
  enrollmentId: string;
  score: number;
  feedback?: string;
  teacherId: string;
}) {
  return prisma.grade.create({
    data: {
      userId: input.userId,
      courseId: input.courseId,
      enrollmentId: input.enrollmentId,
      score: input.score,
      feedback: input.feedback ?? null,
      teacherId: input.teacherId,
    },
  });
}

export async function averageScoreForUser(userId: string): Promise<number> {
  const r = await prisma.grade.aggregate({
    where: { userId },
    _avg: { score: true },
  });
  return Math.round((r._avg.score ?? 0) * 10) / 10;
}

/* ─── Top Courses ──────────────────────────────────────────────── */

export async function topCourses(limit = 5, db: typeof prisma = prisma) {
  const courses = await db.course.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { enrollments: { _count: "desc" } },
    take: limit,
  });
  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    enrollments: c._count.enrollments,
  }));
}
