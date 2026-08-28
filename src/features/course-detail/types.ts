/**
 * Course details for the detail/checkout page.
 * Extends the catalog course with long-form copy only shown on the page.
 */
export interface CourseCurriculumItem {
  id: string;
  title: string;
  durationMinutes: number;
  /** Whether the lesson is free to preview. */
  free?: boolean;
}

export interface CourseLearningOutcome {
  id: string;
  text: string;
}

export interface CourseRequirement {
  id: string;
  text: string;
}

export interface CourseDetail {
  /** Matches the catalog Course.id. */
  id: string;
  title: string;
  subtitle: string;
  longDescription: string;
  level: string;
  category: string;
  mentor: string;
  mentorBio: string;
  mentorInitial: string;
  rating: number;
  reviews: number;
  students: number;
  durationHours: number;
  lessons: number;
  language: string;
  lastUpdated: string;
  price: number | null;
  originalPrice?: number;
  bestseller?: boolean;
  accent: "violet" | "pink" | "orchid" | "amber" | "blue";
  glyph: string;
  outcomes: CourseLearningOutcome[];
  requirements: CourseRequirement[];
  curriculum: CourseCurriculumItem[];
  /**
   * False when the course exists only in the static editorial catalog and
   * has no matching row in the store database — payments/enrollments can
   * only be created against DB rows, so CheckoutForm must not offer a form
   * that could only fail. Set by `mapDbCourseDetail`.
   */
  purchasable?: boolean;
}
