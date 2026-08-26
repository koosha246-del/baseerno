/**
 * Cached dashboard queries — wraps paginated list calls in
 * `unstable_cache` so the dashboard stays fast under load.
 *
 * Revalidation: 60s for user/payment lists, 30s for counts.
 */
import { unstable_cache } from "next/cache";
import { repository } from "../repository";
import { runOnReplica } from "../replica";
import {
  getCachedRoleCounts,
  getCachedCountCourses,
  getCachedCountEnrollments,
  getCachedTotalRevenue,
  getCachedEnrollmentsByMonth,
  getCachedRevenueByMonth,
  getCachedTopCourses,
} from "./reports.queries";

/* ─── Listings (60s TTL) ───────────────────────────────────────── */

export const getCachedUsersList = unstable_cache(
  async (skip: number, take: number) => repository.listUsers({ skip, take }),
  ["dashboard", "users-list"],
  { revalidate: 60, tags: ["users"] },
);

export const getCachedCountUsers = unstable_cache(
  async () => runOnReplica((db) => repository.countUsers(undefined, db)),
  ["dashboard", "users-count"],
  { revalidate: 60, tags: ["users"] },
);

export const getCachedPaymentsList = unstable_cache(
  async (skip: number, take: number, userId?: string) =>
    repository.listPayments({ skip, take, userId }),
  ["dashboard", "payments-list"],
  { revalidate: 60, tags: ["payments"] },
);

export const getCachedCountPayments = unstable_cache(
  async (userId?: string) =>
    runOnReplica((db) => repository.countPayments({ userId }, db)),
  ["dashboard", "payments-count"],
  { revalidate: 30, tags: ["payments"] },
);

export const getCachedCountPaymentsByStatus = unstable_cache(
  async (status: "PAID" | "PENDING" | "FAILED") =>
    runOnReplica((db) => repository.countPayments({ status }, db)),
  ["dashboard", "payments-count-by-status"],
  { revalidate: 30, tags: ["payments"] },
);

export const getCachedCountPaymentsForCourses = unstable_cache(
  async (courseIds: string[], status?: "PAID" | "PENDING" | "FAILED") =>
    runOnReplica((db) => repository.countPaymentsForCourses(courseIds, status, db)),
  ["dashboard", "payments-count-for-courses"],
  { revalidate: 30, tags: ["payments"] },
);

/* ─── Single-call stats bundles (120s TTL) ─────────────────────── */

/**
 * One round trip to Prisma for everything the admin reports page
 * needs. All eight aggregations fire in parallel.
 */
export async function getAdminStatsBundle() {
  const [
    roleCounts,
    courseCount,
    enrollmentCount,
    paidPaymentCount,
    pendingPaymentCount,
    totalRevenue,
    enrollmentsByMonth,
    revenueByMonth,
    topCourses,
  ] = await Promise.all([
    getCachedRoleCounts(),
    getCachedCountCourses(),
    getCachedCountEnrollments(),
    getCachedCountPaymentsByStatus("PAID"),
    // Count PENDING directly — deriving it as total-minus-paid silently
    // counts FAILED payments into the "pending" KPI.
    getCachedCountPaymentsByStatus("PENDING"),
    getCachedTotalRevenue(),
    getCachedEnrollmentsByMonth(),
    getCachedRevenueByMonth(),
    getCachedTopCourses(),
  ]);
  return {
    roleCounts,
    courseCount,
    enrollmentCount,
    paidPaymentCount,
    pendingPaymentCount,
    totalRevenue,
    enrollmentsByMonth,
    revenueByMonth,
    topCourses,
  };
}
