/**
 * Shared Prisma client singleton + helpers.
 * Imported by every domain repo file.
 */
import { PrismaClient } from "@/generated/prisma/client";
import { type Role } from "@/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import type { SafeUser } from "./types";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Add it to .env or your deployment environment.",
  );
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

const globalForPrisma = globalThis as unknown as { __prisma: PrismaClient };
export const prisma = globalForPrisma.__prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

/** Strip password hash for client-safe user shape. */
export function toSafe(user: {
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
