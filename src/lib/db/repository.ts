/**
 * Data repository — thin barrel that merges all domain repos.
 *
 * All callers import `repository` from this file; nothing changes in
 * consuming code. Each domain is a separate file under `./domains/`.
 */
import * as users from "./domains/users.repo";
import * as courses from "./domains/courses.repo";
import * as enrollments from "./domains/enrollments.repo";
import * as payments from "./domains/payments.repo";
import * as messages from "./domains/messages.repo";
import * as notifications from "./domains/notifications.repo";
import * as search from "./domains/search.repo";
import * as ai from "./domains/ai.repo";
import * as loadRuns from "./domains/load-runs.repo";

export const repository = {
  /* Users / Password Resets */
  ...users,
  /* Courses / Lessons */
  ...courses,
  /* Enrollments / Grades */
  ...enrollments,
  /* Payments / Certificates / Revenue */
  ...payments,
  /* Messages */
  ...messages,
  /* Notifications */
  ...notifications,
  /* Search */
  ...search,
  /* AI Tutor */
  ...ai,
  /* Load-test history */
  ...loadRuns,
};

/** Repository type — shape of the merged domain object. */
export type Repository = typeof repository;
