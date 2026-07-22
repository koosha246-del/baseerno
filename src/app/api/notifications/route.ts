import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";

export async function GET(req: Request) {
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

export async function POST(req: Request) {
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
