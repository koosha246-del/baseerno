/**
 * Course level — free string so the DB / static catalog can use any
 * Persian level label (مبتدی مطلق, مقدماتی تا متوسط, B1, A2, …)
 * without having to be a member of a hard-coded union.
 */
export type CourseLevel = string;

export interface CourseCategory {
  id: string;
  label: string;
}

/**
 * Course shape used by homepage cards.
 *
 * The DB row is mapped onto this shape by `mapDbCourse` so the
 * existing card UI keeps working unchanged. Optional fields default
 * to safe placeholders when the database row doesn't carry the data
 * (e.g. `mentorInitial` is derived from the mentor's first name).
 */
export interface Course {
  id: string;
  title: string;
  /** Short one-line hook. */
  subtitle: string;
  category: string;
  level: CourseLevel;
  /** Mentor display name. */
  mentor: string;
  /** Mentor avatar initial. */
  mentorInitial: string;
  rating: number;
  reviews: number;
  /** Duration in hours. */
  durationHours: number;
  /** Lesson count. */
  lessons: number;
  /** Price in Toman; null = free. */
  price: number | null;
  originalPrice?: number | null;
  /** Whether it's a bestseller. */
  bestseller?: boolean;
  /** Visual accent for the cover. */
  accent: "violet" | "pink" | "orchid" | "amber" | "blue";
  /** Cover emoji glyph (decorative). */
  glyph: string;
}
