/**
 * Data cache — Redis-backed `getOrSet` with in-memory fallback.
 *
 * When Redis is available, values are stored with a configurable TTL,
 * so multiple app instances share the same cached data.  When Redis is
 * not configured, the fallback uses Next.js's `unstable_cache` (which
 * is per-instance but works without any infrastructure).
 *
 * Usage:
 * ```ts
 * import { getOrSet } from "@/lib/cache";
 *
 * const courses = await getOrSet("courses:published:8", 300, async () => {
 *   return repository.listCourses({ publishedOnly: true, take: 8 });
 * });
 * ```
 */

import { unstable_cache } from "next/cache";
import { getRedisClient } from "./redis-client";

/**
 * Fetch a value from cache (Redis → unstable_cache). On miss, call
 * `fn`, store the result, and return it.
 *
 * @param key   Cache key (namespaced automatically).
 * @param ttl   Time-to-live in seconds.
 * @param fn    Factory that produces the value on cache miss.
 * @param tags  Optional Next.js cache tags for on-demand revalidation.
 */
export async function getOrSet<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
  tags?: string[],
): Promise<T> {
  // Try Redis first
  const client = await getRedisClient();
  if (client) {
    try {
      const raw = await client.get(`cache:${key}`);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch {
      // Redis error — fall through to unstable_cache
    }
  }

  // Fallback: unstable_cache (per-instance, tag-aware)
  if (tags && tags.length > 0) {
    const cached = unstable_cache(fn, [key], { revalidate: ttl, tags });
    const value = await cached();
    // Back-fill Redis if available (async, don't block)
    if (client) {
      client.set(`cache:${key}`, JSON.stringify(value), { EX: ttl }).catch(() => {});
    }
    return value;
  }

  // No tags — just run the factory directly
  const value = await fn();
  // Back-fill Redis
  if (client) {
    client.set(`cache:${key}`, JSON.stringify(value), { EX: ttl }).catch(() => {});
  }
  return value;
}

/**
 * Invalidate cache keys in both Redis and Next.js tags.
 *
 * @param key  Cache key (or keys) to delete from Redis.
 * @param tags Tags to revalidate in Next.js cache.
 */
export async function invalidateCache(
  key?: string | string[],
  tags?: string[],
): Promise<void> {
  const keys = key ? (Array.isArray(key) ? key : [key]) : [];

  if (keys.length > 0) {
    const client = await getRedisClient();
    if (client) {
      try {
        for (const k of keys) {
          await client.del(`cache:${k}`);
        }
      } catch {
        // best-effort
      }
    }
  }

  if (tags && tags.length > 0) {
    const { revalidateTag } = await import("next/cache");
    for (const tag of tags) {
      revalidateTag(tag);
    }
  }
}

/**
 * Invalidate every per-query course-search cache entry (`search:courses:*`).
 *
 * The autocomplete cache keys are unbounded (one per query string), so
 * exact-key deletion isn't possible — this scans Redis for the pattern
 * and deletes each match. Course mutations call this alongside
 * `invalidateCache(publishedCoursesCacheKeys(), [CACHE_TAGS.courses])`
 * so search results reflect title/subtitle changes immediately instead
 * of waiting out the 60s TTL.
 */
export async function invalidateSearchCourseCache(): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  try {
    if (typeof client.scanIterator !== "function") return;
    for await (const key of client.scanIterator({
      MATCH: "cache:search:courses:*",
      COUNT: 100,
    })) {
      await client.del(key);
    }
  } catch {
    // best-effort — stale entries self-expire via TTL
  }
}