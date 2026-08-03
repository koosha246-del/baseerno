import { repository } from "@/lib/db/repository";

/**
 * Notification helpers.
 *
 * Each helper wraps a single `createNotification` call so API routes
 * stay declarative. They never throw — a failure to enqueue a
 * notification must not break the business action (payment,
 * enrollment, etc). Errors are logged and swallowed.
 */

async function safeNotify(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  try {
    await repository.createNotification(input);
  } catch (err) {
    console.error("[notify]", input.title, err);
  }
}

export function notifyEnrollment(userId: string, courseName: string) {
  return safeNotify({
    userId,
    type: "success",
    title: "ثبت‌نام موفق",
    body: `شما با موفقیت در دوره «${courseName}» ثبت‌نام کردید.`,
    link: "/dashboard/courses",
  });
}

export function notifyPaymentSuccess(
  userId: string,
  courseName: string,
  amount: number,
) {
  return safeNotify({
    userId,
    type: "success",
    title: "پرداخت موفق",
    body: `پرداخت ${amount.toLocaleString("fa-IR")} تومان برای دوره «${courseName}» با موفقیت انجام شد.`,
    link: "/dashboard/finance",
  });
}

export function notifyGradePosted(
  userId: string,
  courseName: string,
  score: number,
) {
  return safeNotify({
    userId,
    type: "info",
    title: "نمره جدید",
    body: `نمره شما در دوره «${courseName}» ثبت شد: ${score} از ۲۰`,
    link: "/dashboard/grades",
  });
}

export function notifyNewMessage(receiverId: string, senderName: string) {
  return safeNotify({
    userId: receiverId,
    type: "info",
    title: "پیام جدید",
    body: `${senderName} برای شما پیام ارسال کرد.`,
    link: "/dashboard/messages",
  });
}

export function notifyCertificateIssued(userId: string, courseName: string) {
  return safeNotify({
    userId,
    type: "success",
    title: "گواهی‌نامه صادر شد",
    body: `گواهی‌نامه دوره «${courseName}» برای شما صادر شد.`,
    link: "/dashboard/certificates",
  });
}

/**
 * Notify every admin user (capped at 10) about an ops/security event —
 * e.g. a load-test regression. Never throws.
 */
export async function notifyAdmins(title: string, body: string, link?: string) {
  try {
    const admins = await repository.listUsers({ role: "ADMIN", take: 10 });
    await Promise.all(
      admins.map((admin) =>
        safeNotify({ userId: admin.id, type: "warning", title, body, link }),
      ),
    );
  } catch (err) {
    console.error("[notify] notifyAdmins failed:", err);
  }
}
