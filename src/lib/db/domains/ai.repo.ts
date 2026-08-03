/**
 * AI domain — conversation threads + chat messages between students and
 * the AI tutor.
 */
import { prisma } from "../prisma-client";

/* ─── Conversations ────────────────────────────────────────────── */

export async function createConversation(input: {
  userId: string;
  courseId?: string | null;
  title?: string;
}) {
  return prisma.conversation.create({
    data: {
      userId: input.userId,
      courseId: input.courseId ?? null,
      title: input.title ?? "گفتگو با دستیار",
    },
  });
}

export async function findConversationById(id: string) {
  return prisma.conversation.findUnique({ where: { id } });
}

/* ─── Chat messages ────────────────────────────────────────────── */

export async function createChatMessage(input: {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
}) {
  return prisma.chatMessage.create({
    data: {
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
    },
  });
}

export async function listChatMessages(
  conversationId: string,
  opts?: { take?: number },
) {
  return prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: opts?.take ?? 50,
  });
}

/**
 * Delete a single chat message — used to roll back the persisted user turn
 * when the LLM call fails, so a retry doesn't duplicate the message.
 */
export async function deleteChatMessage(id: string): Promise<boolean> {
  try {
    await prisma.chatMessage.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
