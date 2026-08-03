/**
 * Cached report aggregations — wraps expensive repository calls in
 * `unstable_cache` so the reports page stays fast under load.
 *
 * Revalidation: 120s (non-sensitive aggregations rarely change).
 *
 * Replica: every aggregation runs through `runOnReplica` so that when
 * `REPLICA_URL` is configured the heavy GROUP BY / aggregate queries are
 * served by the read replica, offloading the primary. Falls back to the
 * primary automatically when the replica is unavailable.
 */
import { unstable_cache } from "next/cache";
import { repository } from "../repository";
import { runOnReplica } from "../replica";

export const getCachedRevenueByMonth = unstable_cache(
  async () => runOnReplica((db) => repository.revenueByMonth(db)),
  ["reports", "revenue-by-month"],
  { revalidate: 120, tags: ["reports"] },
);

export const getCachedEnrollmentsByMonth = unstable_cache(
  async () => runOnReplica((db) => repository.enrollmentsByMonth(db)),
  ["reports", "enrollments-by-month"],
  { revalidate: 120, tags: ["reports"] },
);

export const getCachedTopCourses = unstable_cache(
  async () => runOnReplica((db) => repository.topCourses(5, db)),
  ["reports", "top-courses"],
  { revalidate: 120, tags: ["reports"] },
);

export const getCachedRoleCounts = unstable_cache(
  async () => runOnReplica((db) => repository.countByRole(db)),
  ["reports", "role-counts"],
  { revalidate: 120, tags: ["reports"] },
);

export const getCachedTotalRevenue = unstable_cache(
  async () => runOnReplica((db) => repository.totalRevenue(db)),
  ["reports", "total-revenue"],
  { revalidate: 120, tags: ["reports"] },
);

export const getCachedCountCourses = unstable_cache(
  async () => runOnReplica((db) => repository.countCourses(undefined, db)),
  ["reports", "course-count"],
  { revalidate: 120, tags: ["reports"] },
);

export const getCachedCountEnrollments = unstable_cache(
  async () => runOnReplica((db) => repository.countEnrollments(undefined, db)),
  ["reports", "enrollment-count"],
  { revalidate: 60, tags: ["reports"] },
);
