/**
 * Central cache strategy — Next.js revalidation tags + Redis cache keys.
 *
 * Mutations call `invalidateCache(keys, tags)` (see @/lib/cache) so both
 * the Redis entries and the `unstable_cache`/`fetch` tag entries stay
 * consistent after writes.
 */

export const CACHE_TAGS = {
  users: "users",
  courses: "courses",
  payments: "payments",
  enrollments: "enrollments",
  grades: "grades",
  messages: "messages",
  notifications: "notifications",
  certificates: "certificates",
  lessons: "lessons",
  reports: "admin:reports",
  newsletter: "newsletter",
  corporate: "corporate",
  search: "search",
  course: (id: string) => `course:${id}` as const,
  user: (id: string) => `user:${id}` as const,
} as const;

/**
 * Redis cache keys (the data cache layer prefixes them with `cache:`).
 *
 * `take` is folded into the key so the homepage (take: 8) and the catalog
 * (no take) never share a wrong-sized entry.
 */
export const CACHE_KEYS = {
  publishedCourses: "courses:published",
  publishedCoursesTake: (take: number) => `courses:published:${take}` as const,
} as const;

/** How many courses the homepage shows — must match the page's `take`. */
export const HOMEPAGE_COURSES_TAKE = 8;

/**
 * Every Redis key that mirrors the published-course list. Mutations
 * invalidate all of them so no variant stays stale.
 */
export function publishedCoursesCacheKeys(): string[] {
  return [
    CACHE_KEYS.publishedCourses,
    CACHE_KEYS.publishedCoursesTake(HOMEPAGE_COURSES_TAKE),
  ];
}

/** Convenience: tags to bust after a successful paid/free enrollment. */
export function enrollmentCacheTags(userId: string, courseId: string): string[] {
  return [
    CACHE_TAGS.enrollments,
    CACHE_TAGS.payments,
    CACHE_TAGS.reports,
    CACHE_TAGS.user(userId),
    CACHE_TAGS.course(courseId),
    CACHE_TAGS.courses,
  ];
}
