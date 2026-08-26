/**
 * Domain types — re-exported from Prisma for backward compatibility.
 *
 * All callers that import from "@/lib/db/types" continue to work.
 * The Prisma client is the source of truth for these types.
 */

export type { Role, EnrollmentStatus, PaymentStatus } from "@/generated/prisma/enums";

/** Public-safe user shape (no passwordHash, no deletedAt). */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  tokenVersion: number;
  createdAt: string;
  updatedAt: string;
}


