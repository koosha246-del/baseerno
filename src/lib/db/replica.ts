/**
 * Read-replica support (optional).
 *
 * When `REPLICA_URL` is set, heavy read-only queries (dashboard stats,
 * reports, catalogs) can run against a replica to offload the primary.
 * If the replica is unavailable or not configured, `getReplicaClient`
 * returns null and callers use the primary — zero behavior change.
 *
 * Usage in read paths:
 *   import { runOnReplica } from "@/lib/db/replica";
 *   const value = await runOnReplica((db) => db.course.findMany(...));
 *
 * NOTE: replica is strictly for reads — never write through it. Also the
 * replica may lag a few seconds, so never use it for user-owned data that
 * was just written (use the primary there).
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/lib/env";
import { prisma, extendWithSoftDelete } from "./prisma-client";
import { withUtcSession } from "./conn";

let cachedReplica: PrismaClient | null | undefined;

/** Returns a read-only replica client, or null when not configured/failed. */
export function getReplicaClient(): PrismaClient | null {
  if (!env.REPLICA_URL) return null;
  if (cachedReplica !== undefined) return cachedReplica;

  try {
    // Same UTC-session pin as the primary (see ./conn.ts) so timestamp reads
    // on the replica agree with the primary regardless of server timezone.
    const adapter = new PrismaPg({ connectionString: withUtcSession(env.REPLICA_URL) });
    // Apply the same soft-delete extension as the primary so reads on the
    // replica behave identically (deletedAt: null filtering).
    cachedReplica = extendWithSoftDelete(
      new PrismaClient({ adapter }) as PrismaClient,
    );
  } catch (error) {
    console.warn("[replica] Failed to create replica client — falling back to primary.", error);
    cachedReplica = null;
  }
  return cachedReplica;
}

/**
 * Run a read-only query against the replica when configured; otherwise (or
 * when the replica query fails) fall back to the primary.
 *
 * The callback receives the DB client to use — never reference `prisma`
 * directly inside the callback, so the replica path is actually exercised.
 */
export async function runOnReplica<T>(
  fn: (db: PrismaClient) => Promise<T>,
): Promise<T> {
  const replica = getReplicaClient();
  if (replica) {
    try {
      return await fn(replica);
    } catch (error) {
      console.warn("[replica] Query failed on replica — falling back to primary.", error);
    }
  }
  return fn(prisma);
}
