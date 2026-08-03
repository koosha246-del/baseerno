/**
 * Safe cache wrapper — abstraction over Next.js `unstable_cache`.
 *
 * ## Why this exists
 * Next.js's `unstable_cache` API may change in future versions (v16+).
 * This wrapper provides:
 *  1. A stable, typed interface for all caching needs.
 *  2. A single file to update when the API stabilises or changes.
 *  3. Type-safe tag inference.
 *
 * ## Migration path
 * When `unstable_cache` is removed / renamed / stabilised:
 *   1. Update this file's internal implementation.
 *   2. All callers keep working — no changes needed.
 *
 * ## Usage
 * ```ts
 * import { cache } from "@/lib/cache/safe-cache";
 *
 * export const getFoo = cache(
 *   async (id: string) => repository.findFoo(id),
 *   ["foo", "detail"],
 *   { revalidate: 60, tags: ["foo"] },
 * );
 * ```
 */
import { unstable_cache as nextCache } from "next/cache";

export type CacheOptions = {
  /** Time-to-live in seconds before the cache entry is revalidated. */
  revalidate?: number;
  /** Cache tags for fine-grained invalidation via `revalidateTag()`. */
  tags?: string[];
};

/**
 * Wraps an async function with Next.js's built-in cache layer.
 *
 * @param fn - The async function to cache.
 * @param keyParts - Unique key parts (used as the cache key).
 * @param options - Caching options (revalidate, tags).
 * @returns A cached version of `fn`.
 */
export function cache<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
  keyParts: string[],
  options: CacheOptions = {},
): (...args: Args) => Promise<T> {
  return nextCache(fn, keyParts, {
    revalidate: options.revalidate,
    tags: options.tags,
  });
}

// Re-export the underlying unstable_cache for advanced use cases
// (e.g., when you need direct access to the Next.js cache API).
// Prefer `cache()` above for new code.
export { nextCache as unstableCache };
