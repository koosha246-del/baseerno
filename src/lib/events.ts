/**
 * Application Event Bus — typed publish/subscribe for domain events.
 *
 * Instead of scattering `revalidateTag`, `notify*`, `sendEmail` calls
 * across every route handler, each route publishes a single event and
 * the handlers below fire automatically.
 *
 * Benefits:
 *  - Reliability: no route can forget to invalidate cache or send a
 *    notification.
 *  - Extensibility: adding a new side-effect (e.g. Slack webhook) is
 *    one subscription, not 30 route edits.
 *  - Testability: events can be recorded and asserted on.
 *
 * Usage:
 *   import { publish } from "@/lib/events";
 *
 *   await publish({ type: "user:registered", userId: user.id, email });
 */

// ─── Event types ───────────────────────────────────────────────────

export type AppEvent =
  | { type: "user:registered"; userId: string; email: string; name: string }
  | { type: "user:login"; userId: string; email: string }
  | { type: "user:password-reset"; userId: string; email: string; name: string; resetUrl: string }
  | { type: "enrollment:completed"; userId: string; courseId: string; courseName: string; amount: number }
  | { type: "enrollment:free"; userId: string; courseId: string; courseName: string }
  | { type: "grade:posted"; userId: string; courseId: string; courseName: string; score: number }
  | { type: "message:sent"; senderId: string; receiverId: string; senderName: string }
  | { type: "certificate:issued"; userId: string; courseName: string }
  | { type: "payment:created"; userId: string; courseId: string; amount: number }
  | { type: "contact:submitted"; name: string; email: string; subject: string; message: string }
  | { type: "course:updated"; courseId: string }
  | { type: "course:lessons-changed"; courseId: string }
  | { type: "user:profile-updated"; userId: string }
  | { type: "search:needs-sync"; courseId?: string } // triggers FTS sync
  | {
      type: "load:regression";
      scenario: string;
      currentP95: number;
      previousAvgP95: number;
      diffPercent: number;
    };

// ─── Subscription type ─────────────────────────────────────────────

type EventHandler<E extends AppEvent = AppEvent> = (event: E) => Promise<void>;

const handlers = new Map<AppEvent["type"], Set<EventHandler>>();

// ─── Public API ────────────────────────────────────────────────────

/**
 * Publish an event: all registered handlers for this event type are
 * called concurrently.  Errors are caught and logged individually so
 * one failing handler never blocks the others.
 */
export async function publish(event: AppEvent): Promise<void> {
  const set = handlers.get(event.type);
  if (!set || set.size === 0) return;

  const promises: Promise<void>[] = [];
  for (const handler of set) {
    promises.push(
      handler(event as never).catch((err) => {
        console.error(`[events] Handler failed for ${event.type}:`, err);
      }),
    );
  }
  await Promise.all(promises);
}

/**
 * Register a handler for an event type.  Returns an unsubscribe
 * function.  Handlers are deduplicated by reference identity.
 */
export function on<E extends AppEvent["type"]>(
  type: E,
  handler: EventHandler<Extract<AppEvent, { type: E }>>,
): () => void {
  if (!handlers.has(type)) {
    handlers.set(type, new Set());
  }
  handlers.get(type)!.add(handler as EventHandler);
  return () => {
    handlers.get(type)?.delete(handler as EventHandler);
  };
}

// ─── Built-in subscriptions ────────────────────────────────────────

// Lazy-import helpers to avoid circular deps at module load time.
async function revalidateTag(tag: string) {
  const { revalidateTag: rt } = await import("next/cache");
  rt(tag);
}

async function getCACHE_TAGS() {
  return import("@/lib/cache-tags").then((m) => m.CACHE_TAGS);
}

async function getEnrollmentCacheTags(userId: string, courseId: string) {
  return import("@/lib/cache-tags").then((m) => m.enrollmentCacheTags(userId, courseId));
}

// ─── Cache invalidation subscriptions ──────────────────────────────

on("user:registered", async (event) => {
  const { user } = await getCACHE_TAGS();
  await revalidateTag(user(event.userId));
});

on("enrollment:free", async (event) => {
  const tags = await getEnrollmentCacheTags(event.userId, event.courseId);
  for (const tag of tags) await revalidateTag(tag);
});

on("enrollment:completed", async (event) => {
  const tags = await getEnrollmentCacheTags(event.userId, event.courseId);
  for (const tag of tags) await revalidateTag(tag);
});

on("grade:posted", async (event) => {
  const { grades, enrollments, course, user, reports } = await getCACHE_TAGS();
  await revalidateTag(grades);
  await revalidateTag(enrollments);
  await revalidateTag(course(event.courseId));
  await revalidateTag(user(event.userId));
  await revalidateTag(reports);
});

on("message:sent", async (event) => {
  const { messages, notifications, user } = await getCACHE_TAGS();
  await revalidateTag(messages);
  await revalidateTag(notifications);
  await revalidateTag(user(event.receiverId));
});

on("certificate:issued", async (event) => {
  const { certificates, user, notifications } = await getCACHE_TAGS();
  await revalidateTag(certificates);
  await revalidateTag(user(event.userId));
  await revalidateTag(notifications);
});

on("payment:created", async (_event) => {
  const { payments } = await getCACHE_TAGS();
  await revalidateTag(payments);
});

on("course:updated", async (event) => {
  const { courses, course } = await getCACHE_TAGS();
  await revalidateTag(courses);
  await revalidateTag(course(event.courseId));
});

on("course:lessons-changed", async (event) => {
  const { courses, course, lessons } = await getCACHE_TAGS();
  await revalidateTag(lessons);
  await revalidateTag(course(event.courseId));
  await revalidateTag(courses);
});

on("user:profile-updated", async (event) => {
  const { users, user } = await getCACHE_TAGS();
  await revalidateTag(users);
  await revalidateTag(user(event.userId));
});

// ─── Notification subscriptions ────────────────────────────────────

// Every notify* helper also pushes a realtime (SSE) event to the
// recipient's open connections when present — see /api/notifications/stream.
async function pushRealtime(userId: string, event: Parameters<typeof import("@/lib/realtime").pushToUser>[1]) {
  try {
    const { pushToUser } = await import("@/lib/realtime");
    pushToUser(userId, event);
  } catch {
    // Realtime is best-effort — a failure must never break the event.
  }
}

on("enrollment:free", async (event) => {
  const { notifyEnrollment } = await import("@/lib/notifications");
  await notifyEnrollment(event.userId, event.courseName);
  await pushRealtime(event.userId, {
    type: "notification",
    title: "ثبت‌نام موفق",
    body: `شما در دوره «${event.courseName}» ثبت‌نام کردید.`,
    link: "/dashboard/courses",
  });
});

on("enrollment:completed", async (event) => {
  const { notifyEnrollment, notifyPaymentSuccess } = await import("@/lib/notifications");
  await notifyEnrollment(event.userId, event.courseName);
  await notifyPaymentSuccess(event.userId, event.courseName, event.amount);
  await pushRealtime(event.userId, {
    type: "notification",
    title: "پرداخت موفق",
    body: `پرداخت ${event.amount.toLocaleString("fa-IR")} تومان برای «${event.courseName}» انجام شد.`,
    link: "/dashboard/finance",
  });
});

on("grade:posted", async (event) => {
  const { notifyGradePosted } = await import("@/lib/notifications");
  await notifyGradePosted(event.userId, event.courseName, event.score);
  await pushRealtime(event.userId, {
    type: "notification",
    title: "نمره جدید",
    body: `نمره شما در «${event.courseName}» ثبت شد: ${event.score} از ۲۰`,
    link: "/dashboard/grades",
  });
});

on("message:sent", async (event) => {
  const { notifyNewMessage } = await import("@/lib/notifications");
  await notifyNewMessage(event.receiverId, event.senderName);
  await pushRealtime(event.receiverId, {
    type: "message-sent",
  });
});

on("certificate:issued", async (event) => {
  const { notifyCertificateIssued } = await import("@/lib/notifications");
  await notifyCertificateIssued(event.userId, event.courseName);
  await pushRealtime(event.userId, {
    type: "notification",
    title: "گواهی‌نامه صادر شد",
    body: `گواهی‌نامه «${event.courseName}» برای شما صادر شد.`,
    link: "/dashboard/certificates",
  });
});

// ─── Email subscriptions ───────────────────────────────────────────

on("user:registered", async (event) => {
  const { welcomeEmail } = await import("@/lib/email-templates");
  const { sendEmail } = await import("@/lib/email");
  const content = welcomeEmail(event.name);
  await sendEmail({ to: event.email, ...content });
});

on("user:password-reset", async (event) => {
  const { passwordResetEmail } = await import("@/lib/email-templates");
  const { sendEmail } = await import("@/lib/email");
  const content = passwordResetEmail(event.name, event.resetUrl);
  await sendEmail({ to: event.email, ...content });
});

on("enrollment:completed", async (event) => {
  const { paymentConfirmationEmail } = await import("@/lib/email-templates");
  const { sendEmail } = await import("@/lib/email");
  const { repository } = await import("@/lib/db/repository");
  const user = await repository.findUserById(event.userId);
  if (user) {
    const content = paymentConfirmationEmail(user.name, event.courseName, event.amount);
    await sendEmail({ to: user.email, ...content });
  }
});

// ─── FTS sync subscription ─────────────────────────────────────────

on("search:needs-sync", async (event) => {
  const { syncCourseSearch } = await import("@/lib/db/domains/search.repo");
  try {
    await syncCourseSearch(event.courseId);
  } catch (err) {
    console.error("[events] FTS sync failed:", err);
  }
});

// ─── Audit log subscriptions ───────────────────────────────────────
// Sensitive actions are recorded to AuditLog (see domains/audit.repo.ts).
// Fire-and-forget: never fails the triggering action.

async function writeAudit(entry: {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  meta?: Record<string, unknown>;
}) {
  try {
    const { createAuditLog } = await import("@/lib/db/domains/audit.repo");
    await createAuditLog(entry);
  } catch {
    // best-effort
  }
}

on("user:registered", async (event) => {
  await writeAudit({
    actorId: event.userId,
    action: "auth.register",
    targetType: "User",
    targetId: event.userId,
    meta: { email: event.email },
  });
});

on("user:login", async (event) => {
  await writeAudit({
    actorId: event.userId,
    action: "auth.login",
    targetType: "User",
    targetId: event.userId,
  });
});

on("user:password-reset", async (event) => {
  await writeAudit({
    actorId: event.userId,
    action: "auth.password-reset-requested",
    targetType: "User",
    targetId: event.userId,
  });
});

on("certificate:issued", async (event) => {
  await writeAudit({
    actorId: event.userId,
    action: "certificate.issued",
    targetType: "User",
    targetId: event.userId,
    meta: { courseName: event.courseName },
  });
});

on("payment:created", async (event) => {
  await writeAudit({
    actorId: event.userId,
    action: "payment.created",
    targetType: "Course",
    targetId: event.courseId,
    meta: { amount: event.amount },
  });
});

// ─── Load-test alert subscriptions ────────────────────────────────
// A performance regression found after record:load notifies admins and
// writes an audit-trail entry. Both side effects are fire-and-forget.

on("load:regression", async (event) => {
  await writeAudit({
    action: "load.regression",
    targetType: "LoadRun",
    meta: {
      scenario: event.scenario,
      currentP95: event.currentP95,
      previousAvgP95: event.previousAvgP95,
      diffPercent: Math.round(event.diffPercent * 10) / 10,
    },
  });
  const { notifyAdmins } = await import("@/lib/notifications");
  await notifyAdmins(
    "افت عملکرد در load test",
    `سناریوی ${event.scenario}: p95 از ${Math.round(event.previousAvgP95)} به ${Math.round(event.currentP95)} ms رسید (+${Math.round(event.diffPercent)}٪).`,
    "/dashboard/ops/archive",
  );

  // Severe regressions also page admins by email — threshold in env
  // (LOAD_REGRESSION_EMAIL_THRESHOLD, default 50%). Fire-and-forget.
  const { env } = await import("@/lib/env");
  const { isSevereRegression } = await import("@/lib/load-alerts");
  if (isSevereRegression(event.diffPercent, env.LOAD_REGRESSION_EMAIL_THRESHOLD ?? 50)) {
    try {
      const { repository } = await import("@/lib/db/repository");
      const { loadRegressionAlertEmail } = await import("@/lib/email-templates");
      const { sendEmail } = await import("@/lib/email");
      const admins = await repository.listUsers({ role: "ADMIN", take: 10 });
      const content = loadRegressionAlertEmail(
        event.scenario,
        event.currentP95,
        event.previousAvgP95,
        event.diffPercent,
      );
      await Promise.allSettled(
        admins.map((admin) => sendEmail({ to: admin.email, ...content })),
      );
    } catch (err) {
      console.error("[events] load-regression email failed:", err);
    }
  }
});

// ─── Metrics subscriptions ────────────────────────────────────────
// Business signals recorded via the in-memory metrics registry
// (src/lib/metrics.ts) — surfaced on the admin Ops dashboard
// (/dashboard/ops). Incrementing a counter is synchronous and cheap,
// so these fire alongside the async side effects above.

async function recordMetric(name: string) {
  const { incr } = await import("@/lib/metrics");
  incr(name);
}

on("user:registered", async () => {
  await recordMetric("auth:register");
});

on("user:login", async () => {
  await recordMetric("auth:login");
});

on("enrollment:free", async () => {
  await recordMetric("enrollment:free");
});

on("enrollment:completed", async () => {
  await recordMetric("enrollment:paid");
  await recordMetric("payment:success");
});

// ─── Contact email (direct, not via event) ─────────────────────────
// Contact form is not a domain event — it's an external message.
// We keep the direct sendEmail call in the route handler.