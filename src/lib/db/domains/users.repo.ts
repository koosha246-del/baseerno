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
    // `null` clears the avatar — the profile route's Zod schema accepts a
    // nullable avatar so users can remove their photo.
    avatar: string | null;
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
    // Bump tokenVersion so every existing JWT for this user becomes
    // invalid (session revocation on password change/reset).
    await prisma.user.update({
      where: { id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
    return true;
  } catch {
    return false;
  }
}

/* ─── Password Resets ─────────────────────────────────────────── */

/**
 * Reset tokens are high-entropy (256-bit) single-use secrets, but storing
 * them in PLAINTEXT means a DB read/dump hands over live account-takeover
 * links. We persist a SHA-256 digest instead; the raw token is returned
 * ONCE (for the email link) and never stored. Lookup/claim hash the
 * presented token and compare — same pattern as a password hash.
 *
 * Column type is unchanged (a 64-char hex digest fits the existing
 * String @unique), so this needs no schema migration; pre-existing
 * plaintext rows are single-use and expire within the hour anyway.
 */
export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createPasswordReset(userId: string): Promise<{ token: string }> {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordReset.create({
    data: {
      userId,
      token: hashResetToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  // Return the RAW token — it is the only copy that ever leaves this
  // function, and it belongs in the emailed reset link / dev log.
  return { token };
}

export async function findValidResetToken(rawToken: string) {
  return prisma.passwordReset.findFirst({
    where: {
      token: hashResetToken(rawToken),
      used: false,
      expiresAt: { gt: new Date() },
    },
  });
}

export async function markResetTokenUsed(rawToken: string): Promise<void> {
  await prisma.passwordReset.updateMany({
    where: { token: hashResetToken(rawToken) },
    data: { used: true },
  });
}
