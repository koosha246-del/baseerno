/**
 * Central Next.js cache tag strategy.
 *
 * Mutations call `revalidateTag(...)` with these constants so list/detail
 * pages that use `unstable_cache` or `fetch(..., { next: { tags } })` stay
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
  course: (id: string) => `course:${id}` as const,
  user: (id: string) => `user:${id}` as const,
} as const;

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
