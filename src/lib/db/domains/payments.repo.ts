/**
 * Payments domain — payments + certificates CRUD + revenue stats.
 */
import { prisma } from "../prisma-client";
import type { PaymentStatus } from "@/generated/prisma/enums";

/* ─── Payments ─────────────────────────────────────────────────── */

export async function listPayments(opts?: {
  userId?: string;
  status?: PaymentStatus;
  take?: number;
  skip?: number;
}) {
  return prisma.payment.findMany({
    where: {
      ...(opts?.userId ? { userId: opts.userId } : {}),
      ...(opts?.status ? { status: opts.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.take,
    skip: opts?.skip,
  });
}

export async function countPayments(
  opts?: {
    userId?: string;
    status?: PaymentStatus;
  },
  db: typeof prisma = prisma,
): Promise<number> {
  return db.payment.count({
    where: {
      ...(opts?.userId ? { userId: opts.userId } : {}),
      ...(opts?.status ? { status: opts.status } : {}),
    },
  });
}

export async function countPaymentsForCourses(
  courseIds: string[],
  status?: PaymentStatus,
  db: typeof prisma = prisma,
): Promise<number> {
  if (courseIds.length === 0) return 0;
  return db.payment.count({
    where: {
      courseId: { in: courseIds },
      ...(status ? { status } : {}),
    },
  });
}

export async function sumPaymentsByUser(opts: {
  userId?: string;
  status?: PaymentStatus;
}): Promise<number> {
  const r = await prisma.payment.aggregate({
    where: {
      ...(opts?.userId ? { userId: opts.userId } : {}),
      ...(opts?.status ? { status: opts.status } : {}),
    },
    _sum: { amount: true },
  });
  return r._sum.amount ?? 0;
}

export async function findPayment(id: string) {
  return prisma.payment.findUnique({ where: { id } });
}

export async function findPaymentByAuthority(authority: string) {
  return prisma.payment.findFirst({
    where: { gatewayAuthority: authority },
  });
}

export async function createPayment(input: {
  userId: string;
  courseId: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  gatewayAuthority?: string | null;
}) {
  return prisma.payment.create({
    data: {
      userId: input.userId,
      courseId: input.courseId,
      amount: input.amount,
      status: input.status,
      method: input.method,
      gatewayAuthority: input.gatewayAuthority ?? null,
    },
  });
}

export async function setPaymentAuthority(id: string, authority: string) {
  return prisma.payment.update({
    where: { id },
    data: { gatewayAuthority: authority },
  });
}

export async function markPaymentPaid(
  id: string,
  opts?: { gatewayRefId?: string | number | null },
) {
  return prisma.payment.update({
    where: { id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      ...(opts?.gatewayRefId != null
        ? { gatewayRefId: String(opts.gatewayRefId) }
        : {}),
    },
  });
}

export async function markPaymentFailed(id: string) {
  return prisma.payment.update({
    where: { id },
    data: { status: "FAILED" },
  });
}

export async function totalRevenue(db: typeof prisma = prisma): Promise<number> {
  const result = await db.payment.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/** Single-query revenue for one teacher's courses. */
export async function teacherRevenue(teacherId: string): Promise<number> {
  const result = await prisma.payment.aggregate({
    where: { status: "PAID", course: { mentorId: teacherId } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/** Revenue grouped by teacher — for admin reports. */
export async function revenueByTeacher(): Promise<
  Array<{ mentorId: string; total: number }>
> {
  const groups = await prisma.payment.groupBy({
    by: ["courseId"],
    where: { status: "PAID" },
    _sum: { amount: true },
  });
  if (groups.length === 0) return [];
  const courses = await prisma.course.findMany({
    where: { id: { in: groups.map((g) => g.courseId) } },
    select: { id: true, mentorId: true },
  });
  const map = new Map(courses.map((c) => [c.id, c.mentorId]));
  const totals = new Map<string, number>();
  for (const g of groups) {
    const mentor = map.get(g.courseId);
    if (!mentor) continue;
    totals.set(mentor, (totals.get(mentor) ?? 0) + (g._sum.amount ?? 0));
  }
  return Array.from(totals.entries()).map(([mentorId, total]) => ({
    mentorId,
    total,
  }));
}

/** Sum paid payment amounts grouped by month (raw SQL). */
export async function revenueByMonth(db: typeof prisma = prisma) {
  const rows = await db.$queryRaw<
    Array<{ month: Date; total: bigint }>
  >`
    SELECT date_trunc('month', "paidAt") AS month, SUM(amount)::bigint AS total
    FROM "Payment"
    WHERE status = 'PAID' AND "paidAt" IS NOT NULL AND "deletedAt" IS NULL
    GROUP BY date_trunc('month', "paidAt")
    ORDER BY month ASC
  `;
  return rows.map((r) => ({
    month: r.month.toISOString().slice(0, 7),
    total: Number(r.total),
  }));
}

/* ─── Certificates ─────────────────────────────────────────────── */

export async function listCertificates(userId: string) {
  return prisma.certificate.findMany({ where: { userId } });
}

export async function findCertificateById(id: string) {
  return prisma.certificate.findUnique({ where: { id } });
}

export async function issueCertificate(input: {
  userId: string;
  courseId: string;
  enrollmentId: string;
}) {
  return prisma.certificate.upsert({
    where: { enrollmentId: input.enrollmentId },
    create: {
      userId: input.userId,
      courseId: input.courseId,
      enrollmentId: input.enrollmentId,
      certificateNumber: `CERT-${Date.now()}-${input.enrollmentId.slice(-6).toUpperCase()}`,
    },
    update: {},
  });
}
