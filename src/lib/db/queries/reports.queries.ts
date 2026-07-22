/**
 * Cached report aggregations — wraps expensive repository calls in
 * `unstable_cache` so the reports page stays fast under load.
 *
 * Revalidation: 120s (non-sensitive aggregations rarely change).
 */
import { unstable_cache } from "next/cache";
import { repository } from "../repository";

export const getCachedRevenueByMonth = unstable_cache(
  async () => repository.revenueByMonth(),
  ["reports", "revenue-by-month"],
  { revalidate: 120, tags: ["reports"] },
);

export const getCachedEnrollmentsByMonth = unstable_cache(
  async () => repository.enrollmentsByMonth(),
  ["reports", "enrollments-by-month"],
  { revalidate: 120, tags: ["reports"] },
);

export const getCachedTopCourses = unstable_cache(
  async () => repository.topCourses(5),
  ["reports", "top-courses"],
  { revalidate: 120, tags: ["reports"] },
);

export const getCachedRoleCounts = unstable_cache(
  async () => repository.countByRole(),
  ["reports", "role-counts"],
  { revalidate: 120, tags: ["reports"] },
);

export const getCachedTotalRevenue = unstable_cache(
  async () => repository.totalRevenue(),
  ["reports", "total-revenue"],
  { revalidate: 120, tags: ["reports"] },
);

export const getCachedCountCourses = unstable_cache(
  async () => repository.countCourses(),
  ["reports", "course-count"],
  { revalidate: 120, tags: ["reports"] },
);

export const getCachedCountEnrollments = unstable_cache(
  async () => repository.countEnrollments(),
  ["reports", "enrollment-count"],
  { revalidate: 60, tags: ["reports"] },
);
