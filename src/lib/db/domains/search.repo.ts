/**
 * Search domain — full-text search across courses, messages, users.
 */
import { prisma } from "../prisma-client";

export async function searchCourses(query: string, limit = 10) {
  return prisma.course.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { subtitle: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
    select: { id: true, title: true, subtitle: true },
  });
}

export async function searchMessages(userId: string, query: string, limit = 10) {
  return prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
      body: { contains: query, mode: "insensitive" },
    },
    take: limit,
    orderBy: { sentAt: "desc" },
    select: {
      id: true,
      body: true,
      senderId: true,
      receiverId: true,
      sentAt: true,
    },
  });
}

export async function searchUsers(query: string, limit = 10) {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
    select: { id: true, name: true, email: true, role: true },
  });
  return users;
}
