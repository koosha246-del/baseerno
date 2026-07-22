/**
 * Messages domain — conversations CRUD + mark-as-read.
 */
import { prisma } from "../prisma-client";

export async function listMessages(
  userId: string,
  opts?: { take?: number; skip?: number },
) {
  return prisma.message.findMany({
    where: { OR: [{ receiverId: userId }, { senderId: userId }] },
    orderBy: { sentAt: "desc" },
    take: opts?.take,
    skip: opts?.skip,
  });
}

export async function createMessage(input: {
  senderId: string;
  receiverId: string;
  body: string;
}) {
  return prisma.message.create({
    data: {
      senderId: input.senderId,
      receiverId: input.receiverId,
      body: input.body,
    },
  });
}

export async function markMessageRead(id: string) {
  return prisma.message.update({ where: { id }, data: { read: true } });
}

/**
 * Atomic mark-as-read with ownership check.
 * Only the message's sender or receiver can mark it as read.
 */
export async function markMessageReadForUser(messageId: string, userId: string) {
  try {
    return await prisma.message.update({
      where: {
        id: messageId,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      data: { read: true },
    });
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2025"
    ) {
      return null;
    }
    throw err;
  }
}

export async function markAllMessagesRead(userId: string, senderId?: string) {
  return prisma.message.updateMany({
    where: {
      receiverId: userId,
      read: false,
      ...(senderId ? { senderId } : {}),
    },
    data: { read: true },
  });
}
