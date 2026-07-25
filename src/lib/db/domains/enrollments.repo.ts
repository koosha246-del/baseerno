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

export async function countEnrollments(opts?: {
  userId?: string;
  status?: string;
}): Promise<number> {
  return prisma.enrollment.count({
    where: {
      ...(opts?.userId ? { userId: opts.userId } : {}),
      ...(opts?.status
        ? { status: opts.status as "ACTIVE" | "COMPLETED" | "DROPPED" }
        : {}),
    },
  });
}

export async function countUniqueStudentsForCourses(courseIds: string[]): Promise<number> {
  if (courseIds.length === 0) return 0;
  const r = await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds } },
    select: { userId: true },
    distinct: ["userId"],
  });
  return r.length;
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
export async function enrollmentsByMonth() {
  const rows = await prisma.$queryRaw<
    Array<{ month: Date; count: bigint }>
  >`
    SELECT date_trunc('month', "enrolledAt") AS month, COUNT(*)::bigint AS count
    FROM "Enrollment"
    GROUP BY date_trunc('month', "enrolledAt")
    ORDER BY month ASC
  `;
  return rows.map((r) => ({
    month: r.month.toISOString().slice(0, 7),
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

export async function topCourses(limit = 5) {
  const courses = await prisma.course.findMany({
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
