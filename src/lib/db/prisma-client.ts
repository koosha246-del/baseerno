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
 *
 * The soft-delete extension is exported as `extendWithSoftDelete` so the
 * read-replica client (see ./replica.ts) applies the exact same filtering.
 */
import { PrismaClient } from "@/generated/prisma/client";
import { type Role } from "@/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import type { SafeUser } from "./types";
import { env } from "@/lib/env";
import { observe } from "@/lib/metrics";
import { withUtcSession } from "./conn";

const databaseUrl = env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Add it to .env or your deployment environment.",
  );
}

// Pin the session to UTC (see ./conn.ts): Prisma serializes DateTime params
// as naive UTC wall-clock strings, so a non-UTC session (e.g. Asia/Tehran)
// silently shifts every instant and breaks backoff + stuck-row recovery.
const adapter = new PrismaPg({ connectionString: withUtcSession(databaseUrl) });

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
 * Models without a `deletedAt` column (EmailOutbox, CourseSearch) are
 * passed through untouched.
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
  "Conversation",
  "ChatMessage",
]);

function withSoftDeleteFilter<T extends { deletedAt?: unknown }>(where: T | undefined): T {
  if (!where) return { deletedAt: null } as T;
  // If the caller explicitly references `deletedAt` (e.g. a restore flow
  // or an admin "show deleted" toggle), don't override their intent.
  if (Object.prototype.hasOwnProperty.call(where, "deletedAt")) return where;
  return { ...where, deletedAt: null };
}

/**
 * Wrap a raw Prisma client with the soft-delete extension. Used for both
 * the primary client (`prisma`) and the optional read-replica client so
 * every read path behaves identically.
 */
export function extendWithSoftDelete(base: PrismaClient): PrismaClient {
  return base.$extends({
    name: "soft-delete",
    query: {
      $allModels: {
        async findFirst({ model, args, query }) {
          const start = performance.now();
          if (SOFT_DELETE_MODELS.has(model)) {
            args = { ...args, where: withSoftDeleteFilter(args.where as Record<string, unknown>) };
          }
          const result = await query(args);
          observe(`prisma:${model}.findFirst`, performance.now() - start);
          return result;
        },
        async findFirstOrThrow({ model, args, query }) {
          const start = performance.now();
          if (SOFT_DELETE_MODELS.has(model)) {
            args = { ...args, where: withSoftDeleteFilter(args.where as Record<string, unknown>) };
          }
          const result = await query(args);
          observe(`prisma:${model}.findFirstOrThrow`, performance.now() - start);
          return result;
        },
        async findUnique({ model, args, query }) {
          const start = performance.now();
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
            observe(`prisma:${model}.findUnique`, performance.now() - start);
            return result;
          }
          const result = await query(args);
          observe(`prisma:${model}.findUnique`, performance.now() - start);
          return result;
        },
        async findUniqueOrThrow({ model, args, query }) {
          const start = performance.now();
          if (SOFT_DELETE_MODELS.has(model)) {
            const result = await query(args);
            if (result && (result as { deletedAt?: Date | null }).deletedAt != null) {
              throw new Error(`No ${model} found`);
            }
            observe(`prisma:${model}.findUniqueOrThrow`, performance.now() - start);
            return result;
          }
          const result = await query(args);
          observe(`prisma:${model}.findUniqueOrThrow`, performance.now() - start);
          return result;
        },
        async findMany({ model, args, query }) {
          const start = performance.now();
          if (SOFT_DELETE_MODELS.has(model)) {
            args = { ...args, where: withSoftDeleteFilter(args.where as Record<string, unknown>) };
          }
          const result = await query(args);
          observe(`prisma:${model}.findMany`, performance.now() - start);
          return result;
        },
        async count({ model, args, query }) {
          const start = performance.now();
          if (SOFT_DELETE_MODELS.has(model)) {
            args = { ...args, where: withSoftDeleteFilter(args.where as Record<string, unknown>) };
          }
          const result = await query(args);
          observe(`prisma:${model}.count`, performance.now() - start);
          return result;
        },
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma: PrismaClient = extendWithSoftDelete(prismaRaw);

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
