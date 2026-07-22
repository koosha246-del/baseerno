/**
 * Courses domain — courses + lessons CRUD.
 */
import { prisma } from "../prisma-client";

/* ─── Courses ──────────────────────────────────────────────────── */

export async function listCourses(opts?: {
  publishedOnly?: boolean;
  mentorId?: string;
  take?: number;
  skip?: number;
  includeMentor?: boolean;
  includeEnrollmentCount?: boolean;
}) {
  return prisma.course.findMany({
    where: {
      ...(opts?.publishedOnly ? { published: true } : {}),
      ...(opts?.mentorId ? { mentorId: opts.mentorId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.take,
    skip: opts?.skip,
    include: {
      ...(opts?.includeMentor
        ? { mentor: { select: { id: true, name: true, avatar: true } } }
        : {}),
      ...(opts?.includeEnrollmentCount
        ? { _count: { select: { enrollments: true } } }
        : {}),
    },
  });
}

export async function findCourseById(id: string) {
  return prisma.course.findUnique({ where: { id } });
}

export async function createCourse(input: {
  title: string;
  subtitle: string;
  description: string;
  price: number | null;
  originalPrice?: number | null;
  level: string;
  category: string;
  durationHours: number;
  lessons: number;
  glyph: string;
  accent: string;
  published: boolean;
  rating?: number;
  mentorId: string;
}) {
  return prisma.course.create({
    data: {
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      price: input.price,
      originalPrice: input.originalPrice ?? null,
      level: input.level,
      category: input.category,
      durationHours: input.durationHours,
      lessons: input.lessons,
      glyph: input.glyph,
      accent: input.accent,
      published: input.published,
      rating: input.rating ?? 0,
      mentorId: input.mentorId,
    },
  });
}

export async function updateCourse(
  id: string,
  patch: Partial<{
    title: string;
    subtitle: string;
    description: string;
    price: number | null;
    originalPrice: number | null;
    level: string;
    category: string;
    durationHours: number;
    lessons: number;
    glyph: string;
    accent: string;
    published: boolean;
  }>,
) {
  return prisma.course.update({ where: { id }, data: patch });
}

export async function unpublishCourse(id: string) {
  return prisma.course.update({ where: { id }, data: { published: false } });
}

export async function countCourses(opts?: { publishedOnly?: boolean; mentorId?: string }): Promise<number> {
  return prisma.course.count({
    where: {
      ...(opts?.publishedOnly ? { published: true } : {}),
      ...(opts?.mentorId ? { mentorId: opts.mentorId } : {}),
    },
  });
}

/* ─── Lessons ─────────────────────────────────────────────────── */

export async function listLessons(courseId: string) {
  return prisma.lesson.findMany({
    where: { courseId, published: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listAllLessons(courseId: string) {
  return prisma.lesson.findMany({
    where: { courseId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listLessonsForCourses(
  courseIds: string[],
): Promise<
  Array<{
    id: string;
    courseId: string;
    title: string;
    type: string;
    durationMinutes: number;
    sortOrder: number;
    isFree: boolean;
    published: boolean;
    videoUrl: string | null;
  }>
> {
  if (courseIds.length === 0) return [];
  return prisma.lesson.findMany({
    where: { courseId: { in: courseIds } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function findLessonById(id: string) {
  return prisma.lesson.findUnique({ where: { id } });
}

export async function createLesson(input: {
  courseId: string;
  title: string;
  type?: string;
  videoUrl?: string;
  durationMinutes: number;
  sortOrder?: number;
  isFree?: boolean;
}) {
  return prisma.lesson.create({
    data: {
      courseId: input.courseId,
      title: input.title,
      type: input.type ?? "video",
      videoUrl: input.videoUrl ?? null,
      durationMinutes: input.durationMinutes,
      sortOrder: input.sortOrder ?? 0,
      isFree: input.isFree ?? false,
    },
  });
}

export async function updateLesson(
  id: string,
  patch: Partial<{
    title: string;
    type: string;
    videoUrl: string | null;
    durationMinutes: number;
    sortOrder: number;
    isFree: boolean;
    published: boolean;
  }>,
) {
  return prisma.lesson.update({ where: { id }, data: patch });
}

export async function deleteLesson(id: string) {
  return prisma.lesson.delete({ where: { id } });
}

export async function countLessons(courseId: string): Promise<number> {
  return prisma.lesson.count({ where: { courseId, published: true } });
}
