import type { Course } from "./types";
import type { repository } from "@/lib/db/repository";

type DbCourse = Awaited<ReturnType<typeof repository.listCourses>>[number];

/**
 * Valid accent values accepted by the visual layer.
 * Any unknown DB value falls back to a safe default rather than crashing.
 */
const ACCENTS = new Set<Course["accent"]>(["violet", "pink", "orchid", "amber", "blue"]);

/**
 * Map a Prisma Course row (with optional mentor) to the homepage
 * Course shape. Missing / unknown fields fall back to safe defaults
 * so the card UI never crashes on a row that hasn't been enriched.
 *
 * Extracted into its own module so it can be reused across server
 * components (homepage, course detail page, etc.) without duplicating
 * the fallback logic.
 */
export function mapDbCourse(
  row: DbCourse & { mentor?: { name: string } | null },
): Course {
  const accent = ACCENTS.has(row.accent as Course["accent"])
    ? (row.accent as Course["accent"])
    : "blue";
  const mentorName = row.mentor?.name ?? "مدرس";
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    level: (row.level as Course["level"]) || "مقدماتی",
    mentor: mentorName,
    mentorInitial: mentorName.charAt(0) || "؟",
    rating: row.rating ?? 0,
    reviews: 0, // no review model in schema; shown as 0 until added
    durationHours: row.durationHours,
    lessons: row.lessons,
    price: row.price,
    originalPrice: row.originalPrice,
    bestseller: false, // no flag in schema; reserved for future
    accent,
    glyph: row.glyph,
  };
}
