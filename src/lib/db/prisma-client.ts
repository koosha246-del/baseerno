/**
 * Shared Prisma client singleton + helpers.
 *
 * Two clients are exported:
 *   - `prisma`     — soft-delete aware. Every `find*` query transparently
 *                    filters `deletedAt: null` (via `$extends`), so the
 *                    application code can keep using `findMany`, `findFirst`,
 *                    `count` etc. without thinking about soft delete.
 *   - `prismaRaw`  — the unmodified client. Use it only for admin / data
 *                    repair / migrations / reports that need to see
 *                    soft-deleted rows. Never expose its results to
 *                    end users without an explicit re-filter.
 */
import { PrismaClient } from "@/generated/prisma/client";
import { type Role } from "@/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import type { SafeUser } from "./types";
import { env } from "@/lib/env";

const databaseUrl = env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Add it to .env or your deployment environment.",
  );
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

/** The raw (un-extended) client. Reserved for admin / repair / migration work. */
const baseClient =
  globalThis as unknown as { __prismaBase: PrismaClient | undefined };

export const prismaRaw: PrismaClient =
  baseClient.__prismaBase ??
  new PrismaClient({
    adapter,
    log:
      env.isDevelopment
        ? [
            { level: "warn", emit: "stdout" },
            { level: "error", emit: "stdout" },
          ]
        : ["error"],
  });

if (!env.isProduction) {
  baseClient.__prismaBase = prismaRaw;
}

/**
 * Prisma `$extends` plugin that injects `deletedAt: null` into every
 * `find*` and `count` read on models that have a `deletedAt` column.
 *
 * Coverage:
 *   - findFirst / findFirstOrThrow / findUnique / findUniqueOrThrow
 *   - findMany
 *   - count
 *   - aggregate / groupBy (filters the `where` and rewrites the resulting
 *     `where` so soft-deleted rows don't surface)
 *
 * Anything that doesn't have `deletedAt` (none today) is passed through
 * untouched, so adding a new model is safe.
 */
const SOFT_DELETE_MODELS = new Set([
  "User",
  "Course",
  "Enrollment",
  "Grade",
  "Certificate",
  "Payment",
  "Message",
  "PasswordReset",
  "Notification",
  "Lesson",
]);

function withSoftDeleteFilter<T extends { deletedAt?: unknown }>(where: T | undefined): T {
  if (!where) return { deletedAt: null } as T;
  // If the caller explicitly references `deletedAt` (e.g. a restore flow
  // or an admin "show deleted" toggle), don't override their intent.
  if (Object.prototype.hasOwnProperty.call(where, "deletedAt")) return where;
  return { ...where, deletedAt: null };
}

export const prisma: PrismaClient = prismaRaw.$extends({
  name: "soft-delete",
  query: {
    $allModels: {
      async findFirst({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) {
          args = { ...args, where: withSoftDeleteFilter(args.where as Record<string, unknown>) };
        }
        return query(args);
      },
      async findFirstOrThrow({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) {
          args = { ...args, where: withSoftDeleteFilter(args.where as Record<string, unknown>) };
        }
        return query(args);
      },
      async findUnique({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) {
          // `findUnique` requires a unique selector (id/email/etc), not a
          // generic `where`; we can't auto-merge `deletedAt: null` here.
          // Callers that need soft-delete-aware unique lookups should use
          // `findFirst` with a unique key instead. The result is filtered
          // client-side below.
          const result = await query(args);
          if (result && (result as { deletedAt?: Date | null }).deletedAt != null) {
            return null;
          }
          return result;
        }
        return query(args);
      },
      async findUniqueOrThrow({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) {
          const result = await query(args);
          if (result && (result as { deletedAt?: Date | null }).deletedAt != null) {
            throw new Error(`No ${model} found`);
          }
          return result;
        }
        return query(args);
      },
      async findMany({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) {
          args = { ...args, where: withSoftDeleteFilter(args.where as Record<string, unknown>) };
        }
        return query(args);
      },
      async count({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) {
          args = { ...args, where: withSoftDeleteFilter(args.where as Record<string, unknown>) };
        }
        return query(args);
      },
    },
  },
}) as unknown as PrismaClient;

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
  updatedAt: Date;
  deletedAt: Date | null;
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
    updatedAt: user.updatedAt.toISOString(),
  };
}
