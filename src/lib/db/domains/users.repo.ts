/**
 * Users domain — user CRUD, password resets, role counts.
 */
import { prisma, toSafe } from "../prisma-client";
import { type Role } from "@/generated/prisma/enums";
import crypto from "crypto";
import type { SafeUser } from "../types";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findSafeUserById(id: string): Promise<SafeUser | null> {
  const u = await prisma.user.findUnique({ where: { id } });
  return u ? toSafe(u) : null;
}

export async function createUser(input: {
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
}

export async function listUsers(opts?: {
  role?: Role;
  take?: number;
  skip?: number;
  ids?: string[];
  orderBy?: "createdAt" | "name";
}): Promise<SafeUser[]> {
  const users = await prisma.user.findMany({
    where: {
      ...(opts?.role ? { role: opts.role } : {}),
      ...(opts?.ids ? { id: { in: opts.ids } } : {}),
    },
    orderBy: opts?.orderBy === "name" ? { name: "asc" } : { createdAt: "desc" },
    take: opts?.take,
    skip: opts?.skip,
  });
  return users.map(toSafe);
}

export async function countUsers(
  opts?: { role?: Role },
  db: typeof prisma = prisma,
): Promise<number> {
  return db.user.count({ where: opts?.role ? { role: opts.role } : undefined });
}

export async function updateUser(
  id: string,
  patch: Partial<{
    name: string;
    phone: string;
    bio: string;
    avatar: string;
    twoFactorSecret: string | null;
    twoFactorEnabled: boolean;
  }>,
): Promise<SafeUser | null> {
  try {
    const user = await prisma.user.update({ where: { id }, data: patch });
    return toSafe(user);
  } catch {
    return null;
  }
}

export async function countByRole(db: typeof prisma = prisma): Promise<Record<Role, number>> {
  const groups = await db.user.groupBy({ by: ["role"], _count: true });
  const counts: Record<string, number> = { STUDENT: 0, TEACHER: 0, ADMIN: 0 };
  for (const g of groups) counts[g.role] = g._count;
  return counts as Record<Role, number>;
}

export async function updatePassword(id: string, passwordHash: string): Promise<boolean> {
  try {
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    return true;
  } catch {
    return false;
  }
}

/* ─── Password Resets ─────────────────────────────────────────── */

export async function createPasswordReset(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  return prisma.passwordReset.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
}

export async function findValidResetToken(token: string) {
  return prisma.passwordReset.findFirst({
    where: { token, used: false, expiresAt: { gt: new Date() } },
  });
}

export async function markResetTokenUsed(token: string): Promise<void> {
  await prisma.passwordReset.updateMany({ where: { token }, data: { used: true } });
}
