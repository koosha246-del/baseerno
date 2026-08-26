/**
 * Notifications domain — notification CRUD.
 */
import { prisma } from "../prisma-client";

export async function listNotifications(
  userId: string,
  opts?: { take?: number; unreadOnly?: boolean },
) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(opts?.unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 20,
  });
}

export async function createNotification(input: {
  userId: string;
  type?: string;
  title: string;
  body: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? "info",
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    },
  });
}

export async function markNotificationRead(id: string, userId: string) {
  // Scope the update to the notification's owner so one user can never
  // mark another user's notification as read (IDOR).
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}
