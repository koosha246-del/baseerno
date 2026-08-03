import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

async function listNotificationsHandler(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const take = Number(searchParams.get("take") ?? 20);
  const unreadOnly = searchParams.get("unread") === "true";

  const notifications = await repository.listNotifications(user.id, { take, unreadOnly });
  const unreadCount = await repository.countUnreadNotifications(user.id);

  return NextResponse.json({ notifications, unreadCount });
}

/**
 * List notifications — wrapped in rate limiting (READ preset) so a
 * database outage surfaces as a clean 503 (with rate-limit headers)
 * instead of a raw 500, matching every other DB-backed API route.
 */
export const GET = withRateLimit(listNotificationsHandler, RATE_LIMIT_PRESETS.READ, {
  keyPrefix: "notifications:list",
});

async function createNotificationHandler(req: Request) {
  // CSRF: notification creation mutates on behalf of the admin session.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  const { userId, type, title, body: content, link } = body as {
    userId?: string;
    type?: string;
    title?: string;
    body?: string;
    link?: string;
  };

  if (!userId || !title || !content) {
    return NextResponse.json({ error: "فیلدهای الزامی ناقص." }, { status: 422 });
  }

  const notification = await repository.createNotification({
    userId,
    type,
    title,
    body: content,
    link,
  });

  return NextResponse.json({ notification }, { status: 201 });
}

/** API: max=20, burst=5 per minute. */
export const POST = withRateLimit(createNotificationHandler, RATE_LIMIT_PRESETS.API, {
  keyPrefix: "notifications:create",
});