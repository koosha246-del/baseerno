/**
 * Cached query layer — barrel that re-exports from domain query files.
 *
 * All callers continue to import from `@/lib/db/queries` as before.
 * The queries are now split into domain files under `./queries/`:
 *
 *   reports.queries.ts   — cached report aggregations (120s TTL)
 *   dashboard.queries.ts — cached dashboard lists + stats bundle
 *   courses.queries.ts   — cached public published-course listings
 */
export {
  getCachedRevenueByMonth,
  getCachedEnrollmentsByMonth,
  getCachedTopCourses,
  getCachedRoleCounts,
  getCachedTotalRevenue,
  getCachedCountCourses,
  getCachedCountEnrollments,
} from "./queries/reports.queries";

export {
  getCachedUsersList,
  getCachedCountUsers,
  getCachedPaymentsList,
  getCachedCountPayments,
  getCachedCountPaymentsForCourses,
  getAdminStatsBundle,
} from "./queries/dashboard.queries";

export { getCachedPublishedCourses } from "./queries/courses.queries";
