/**
 * Data repository — Prisma-backed persistence layer.
 *
 * All callers use this single abstraction. The interface is stable;
 * only the implementation changes when swapping backends.
 */

import { PrismaClient } from "@/generated/prisma/client";
import { type Role, type PaymentStatus } from "@/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";
import type { SafeUser } from "./types";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Add it to .env or your deployment environment."
  );
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

const globalForPrisma = globalThis as unknown as { __prisma: PrismaClient };
const prisma = globalForPrisma.__prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

/** Strip password hash for client-safe user shape. */
function toSafe(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as SafeUser["role"],
    avatar: user.avatar,
    phone: user.phone,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
  };
}

export const repository = {
  // ─── Users ──────────────────────────────────────────────────────
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  async findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async findSafeUserById(id: string): Promise<SafeUser | null> {
    const u = await prisma.user.findUnique({ where: { id } });
    return u ? toSafe(u) : null;
  },

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    phone?: string;
  }): Promise<SafeUser> {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        role: input.role,
        phone: input.phone ?? null,
      },
    });
    return toSafe(user);
  },

  async listUsers(opts?: { role?: Role; take?: number; skip?: number }): Promise<SafeUser[]> {
    const users = await prisma.user.findMany({
      where: opts?.role ? { role: opts.role } : undefined,
      orderBy: { createdAt: "desc" },
      take: opts?.take,
      skip: opts?.skip,
    });
    return users.map(toSafe);
  },

  async updateUser(
    id: string,
    patch: Partial<{ name: string; phone: string; bio: string; avatar: string }>
  ): Promise<SafeUser | null> {
    try {
      const user = await prisma.user.update({ where: { id }, data: patch });
      return toSafe(user);
    } catch {
      return null;
    }
  },

  async countByRole(): Promise<Record<Role, number>> {
    const groups = await prisma.user.groupBy({ by: ["role"], _count: true });
    const counts: Record<string, number> = { STUDENT: 0, TEACHER: 0, ADMIN: 0 };
    for (const g of groups) {
      counts[g.role] = g._count;
    }
    return counts as Record<Role, number>;
  },

  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    try {
      await prisma.user.update({ where: { id }, data: { passwordHash } });
      return true;
    } catch {
      return false;
    }
  },

  // ─── Courses ────────────────────────────────────────────────────
  async listCourses(opts?: {
    publishedOnly?: boolean;
    mentorId?: string;
    take?: number;
    skip?: number;
  }) {
    return prisma.course.findMany({
      where: {
        ...(opts?.publishedOnly ? { published: true } : {}),
        ...(opts?.mentorId ? { mentorId: opts.mentorId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: opts?.take,
      skip: opts?.skip,
    });
  },

  async findCourseById(id: string) {
    return prisma.course.findUnique({ where: { id } });
  },

  async createCourse(
    input: {
      title: string;
      subtitle: string;
      description: string;
      price: number | null;
      originalPrice?: number | null;
      level: string;
      category: string;
      durationHours: number;
      lessons: number;
      glyph: string;
      accent: string;
      published: boolean;
      rating?: number;
      mentorId: string;
    }
  ) {
    return prisma.course.create({
      data: {
        title: input.title,
        subtitle: input.subtitle,
        description: input.description,
        price: input.price,
        originalPrice: input.originalPrice ?? null,
        level: input.level,
        category: input.category,
        durationHours: input.durationHours,
        lessons: input.lessons,
        glyph: input.glyph,
        accent: input.accent,
        published: input.published,
        rating: input.rating ?? 0,
        mentorId: input.mentorId,
      },
    });
  },

  async updateCourse(
    id: string,
    patch: Partial<{
      title: string;
      subtitle: string;
      description: string;
      price: number | null;
      originalPrice: number | null;
      level: string;
      category: string;
      durationHours: number;
      lessons: number;
      glyph: string;
      accent: string;
      published: boolean;
    }>
  ) {
    return prisma.course.update({ where: { id }, data: patch });
  },

  async unpublishCourse(id: string) {
    return prisma.course.update({ where: { id }, data: { published: false } });
  },

  // ─── Enrollments ────────────────────────────────────────────────
  async listEnrollments(userId?: string, opts?: { take?: number; skip?: number }) {
    return prisma.enrollment.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { enrolledAt: "desc" },
      take: opts?.take,
      skip: opts?.skip,
    });
  },

  async listEnrollmentsForCourse(courseId: string) {
    return prisma.enrollment.findMany({ where: { courseId } });
  },

  async findEnrollment(userId: string, courseId: string) {
    return prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
  },

  async createEnrollment(input: { userId: string; courseId: string; progress?: number }) {
    return prisma.enrollment.create({
      data: {
        userId: input.userId,
        courseId: input.courseId,
        progress: input.progress ?? 0,
        status: "ACTIVE",
      },
    });
  },

  // ─── Grades ─────────────────────────────────────────────────────
  async listGrades(
    userId?: string,
    teacherId?: string,
    opts?: { take?: number; skip?: number }
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
  },

  async createGrade(input: {
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
  },

  // ─── Certificates ───────────────────────────────────────────────
  async listCertificates(userId: string) {
    return prisma.certificate.findMany({ where: { userId } });
  },

  // ─── Payments ───────────────────────────────────────────────────
  async listPayments(opts?: {
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
  },

  async findPayment(id: string) {
    return prisma.payment.findUnique({ where: { id } });
  },

  async createPayment(input: {
    userId: string;
    courseId: string;
    amount: number;
    status: PaymentStatus;
    method: string;
  }) {
    return prisma.payment.create({
      data: {
        userId: input.userId,
        courseId: input.courseId,
        amount: input.amount,
        status: input.status,
        method: input.method,
      },
    });
  },

  async markPaymentPaid(id: string) {
    return prisma.payment.update({
      where: { id },
      data: { status: "PAID", paidAt: new Date() },
    });
  },

  async totalRevenue(): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  },

  async teacherRevenue(teacherId: string): Promise<number> {
    const courses = await prisma.course.findMany({
      where: { mentorId: teacherId },
      select: { id: true },
    });
    const courseIds = courses.map((c) => c.id);
    const result = await prisma.payment.aggregate({
      where: { status: "PAID", courseId: { in: courseIds } },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  },

  // ─── Messages ───────────────────────────────────────────────────
  async listMessages(userId: string, opts?: { take?: number; skip?: number }) {
    return prisma.message.findMany({
      where: {
        OR: [{ receiverId: userId }, { senderId: userId }],
      },
      orderBy: { sentAt: "desc" },
      take: opts?.take,
      skip: opts?.skip,
    });
  },

  async createMessage(input: {
    senderId: string;
    receiverId: string;
    body: string;
  }) {
    return prisma.message.create({
      data: {
        senderId: input.senderId,
        receiverId: input.receiverId,
        body: input.body,
      },
    });
  },

  // ─── Password Resets ───────────────────────────────────────────
  async createPasswordReset(userId: string) {
    const token = crypto.randomBytes(32).toString("hex");
    return prisma.passwordReset.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
  },

  async findValidResetToken(token: string) {
    return prisma.passwordReset.findFirst({
      where: {
        token,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });
  },

  async markResetTokenUsed(token: string): Promise<void> {
    await prisma.passwordReset.updateMany({
      where: { token },
      data: { used: true },
    });
  },

  // ─── Lessons ───────────────────────────────────────────────────
  async listLessons(courseId: string) {
    return prisma.lesson.findMany({
      where: { courseId, published: true },
      orderBy: { sortOrder: "asc" },
    });
  },

  async listAllLessons(courseId: string) {
    return prisma.lesson.findMany({
      where: { courseId },
      orderBy: { sortOrder: "asc" },
    });
  },

  async findLessonById(id: string) {
    return prisma.lesson.findUnique({ where: { id } });
  },

  async createLesson(input: {
    courseId: string;
    title: string;
    type?: string;
    durationMinutes: number;
    sortOrder?: number;
    isFree?: boolean;
  }) {
    return prisma.lesson.create({
      data: {
        courseId: input.courseId,
        title: input.title,
        type: input.type ?? "video",
        durationMinutes: input.durationMinutes,
        sortOrder: input.sortOrder ?? 0,
        isFree: input.isFree ?? false,
      },
    });
  },

  async updateLesson(
    id: string,
    patch: Partial<{
      title: string;
      type: string;
      durationMinutes: number;
      sortOrder: number;
      isFree: boolean;
      published: boolean;
    }>
  ) {
    return prisma.lesson.update({ where: { id }, data: patch });
  },

  async deleteLesson(id: string) {
    return prisma.lesson.delete({ where: { id } });
  },

  async countLessons(courseId: string): Promise<number> {
    return prisma.lesson.count({ where: { courseId, published: true } });
  },
};

export type Repository = typeof repository;
