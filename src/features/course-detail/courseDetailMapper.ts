/**
 * Course detail mapper — hybrid DB + static fallback.
 *
 * 1. Fetches the course + mentor + lessons from the database.
 * 2. Enrichs with static content (outcomes, requirements, longDescription)
 *    from the fallback constants when available.
 *
 * This lets the DB drive canonical data (title, price, level, lessons)
 * while the static fallback provides the rich editorial content that
 * isn't yet in the schema.
 */
import { repository } from "@/lib/db/repository";
import { courseDetails as staticDetails } from "./constants";
import type {
  CourseDetail,
  CourseCurriculumItem,
} from "./types";

/** Valid accent values accepted by the visual layer. */
const ACCENTS = new Set<"violet" | "pink" | "orchid" | "amber" | "blue">([
  "violet",
  "pink",
  "orchid",
  "amber",
  "blue",
]);

/**
 * Load a course detail row from the database with its mentor and lessons,
 * then merge with the static fallback for rich editorial content.
 *
 * Returns `null` when neither the DB nor the static catalog has the course.
 */
export async function mapDbCourseDetail(
  id: string,
): Promise<CourseDetail | null> {
  const staticFallback = staticDetails[id];

  // Try DB first
  let dbRow: Awaited<ReturnType<typeof repository.findCourseById>> | null = null;
  let mentorName = "";
  let mentorBio = "";
  let students = 0;
  let dbLessons: Awaited<ReturnType<typeof repository.listLessons>> = [];
  try {
    dbRow = await repository.findCourseById(id);
    if (dbRow) {
      // Mentor, enrollment count, and lessons are independent — run them in
      // parallel instead of four sequential round-trips. Each is wrapped so
      // a failure in one falls back to static content instead of throwing.
      const mentorRes = repository.findSafeUserById(dbRow.mentorId).catch(() => null);
      const countRes = repository.countEnrollments({ courseId: id }).catch(() => 0);
      const lessonsRes = repository.listLessons(id).catch(() => []);
      const [mentor, enrolledCount, lessons] = await Promise.all([mentorRes, countRes, lessonsRes]);
      mentorName = mentor?.name ?? staticFallback?.mentor ?? "مدرس";
      mentorBio = mentor?.bio ?? staticFallback?.mentorBio ?? "";
      students = enrolledCount || staticFallback?.students || 0;
      dbLessons = lessons;
    }
  } catch {
    // DB unreachable — fall through to static
  }

  // If neither DB nor static has it, return null
  if (!dbRow && !staticFallback) return null;

  const accent = ACCENTS.has(
    (dbRow?.accent ?? staticFallback?.accent ?? "blue") as CourseDetail["accent"],
  )
    ? ((dbRow?.accent ?? staticFallback?.accent ?? "blue") as CourseDetail["accent"])
    : "blue";

  // Build curriculum from DB lessons, falling back to static
  const curriculum: CourseCurriculumItem[] =
    dbLessons.length > 0
      ? dbLessons.map((l) => ({
          id: l.id,
          title: l.title,
          durationMinutes: l.durationMinutes,
          free: l.isFree,
        }))
      : staticFallback?.curriculum ?? [];

  return {
    id: dbRow?.id ?? id,
    title: dbRow?.title ?? staticFallback?.title ?? "دوره",
    subtitle: dbRow?.subtitle ?? staticFallback?.subtitle ?? "",
    longDescription:
      staticFallback?.longDescription ?? dbRow?.description ?? "",
    level: dbRow?.level ?? staticFallback?.level ?? "مقدماتی",
    category: dbRow?.category ?? staticFallback?.category ?? "grammar",
    mentor: mentorName || staticFallback?.mentor || "مدرس",
    mentorBio: mentorBio || staticFallback?.mentorBio || "",
    mentorInitial: (mentorName || staticFallback?.mentor || "م").charAt(0) || "م",
    rating: dbRow?.rating ?? staticFallback?.rating ?? 0,
    reviews: staticFallback?.reviews ?? 0,
    students: students || staticFallback?.students || 0,
    durationHours: dbRow?.durationHours ?? staticFallback?.durationHours ?? 0,
    lessons: dbLessons.length || dbRow?.lessons || staticFallback?.lessons || 0,
    language: staticFallback?.language ?? "فارسی + انگلیسی",
    lastUpdated: staticFallback?.lastUpdated ?? "",
    price: dbRow?.price ?? staticFallback?.price ?? null,
    originalPrice:
      dbRow?.originalPrice ?? staticFallback?.originalPrice ?? undefined,
    bestseller: staticFallback?.bestseller ?? false,
    accent,
    glyph: dbRow?.glyph ?? staticFallback?.glyph ?? "📚",
    outcomes: staticFallback?.outcomes ?? [],
    requirements: staticFallback?.requirements ?? [],
    curriculum,
  };
}
