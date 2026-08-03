/**
 * Cached public course queries — Redis-backed `getOrSet` with
 * `unstable_cache` fallback (see @/lib/cache).
 *
 * Revalidation strategy:
 *  - Redis-first: key `courses:published` with TTL 300s, shared across
 *    all app instances. `take` is folded into the key so the homepage
 *    (take: 8) and the catalog (no take) each get their own entry and
 *    never share a wrong-sized result.
 *  - Fallback: when Redis is not configured, `getOrSet` uses
 *    `unstable_cache` (tagged `courses`).
 *  - On-demand invalidation: mutations call
 *    `invalidateCache(publishedCoursesCacheKeys(), tags)` (see
 *    `/api/courses`, admin moderate route) so published-course changes
 *    appear immediately — Redis entries are deleted AND the `courses`
 *    tag is revalidated for the unstable_cache fallback.
 *
 * Only the *public* listing is cached here. Dashboard / mentor-scoped
 * listings stay uncached on purpose — they are user-specific and dynamic.
 */
import { getOrSet } from "@/lib/cache";
import { CACHE_TAGS, CACHE_KEYS } from "../../cache-tags";
import { repository } from "../repository";

/**
 * Cached list of published courses (with mentor info).
 *
 * The cache key includes `take` (e.g. `courses:published:8` vs
 * `courses:published`), so the homepage and catalog never share a
 * wrong-sized result.
 */
export async function getCachedPublishedCourses(take?: number) {
  const key = take
    ? CACHE_KEYS.publishedCoursesTake(take)
    : CACHE_KEYS.publishedCourses;

  return getOrSet(key, 300, () =>
    repository.listCourses({
      publishedOnly: true,
      includeMentor: true,
      take,
    }),
    [CACHE_TAGS.courses],
  );
}
