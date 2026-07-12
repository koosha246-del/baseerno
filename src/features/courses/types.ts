export type CourseLevel = "مقدماتی" | "متوسط" | "پیشرفته" | "حرفه‌ای";

export interface CourseCategory {
  id: string;
  label: string;
}

export interface Course {
  id: string;
  title: string;
  /** Short one-line hook. */
  subtitle: string;
  category: CourseCategory["id"];
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
  originalPrice?: number;
  /** Whether it's a bestseller. */
  bestseller?: boolean;
  /** Visual accent for the cover. */
  accent: "violet" | "pink" | "orchid" | "amber" | "blue";
  /** Cover emoji glyph (decorative). */
  glyph: string;
}
