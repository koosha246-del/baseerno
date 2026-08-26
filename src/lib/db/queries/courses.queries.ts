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
 * The cache key includes `take` and `skip` (e.g. `courses:published:8:0` vs
 * `courses:published`), so different paginated pages never share a
 * wrong-sized result.
 */
export async function getCachedPublishedCourses(take?: number, skip?: number) {
  // Fold BOTH pagination params into the key — `take` alone is not enough:
  // getCachedPublishedCourses(undefined, 10) must not collide with page 0.
  const key =
    CACHE_KEYS.publishedCourses +
    (take ? `:${take}` : "") +
    (skip ? `:${skip}` : "");

  return getOrSet(key, 300, () =>
    repository.listCourses({
      publishedOnly: true,
      includeMentor: true,
      take,
      skip,
    }),
    [CACHE_TAGS.courses],
  );
}
