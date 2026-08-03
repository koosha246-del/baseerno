/**
 * Navigation configuration — section ids + simple Persian labels for students.
 * Section ids must match homepage section `id` attributes.
 *
 * Aligned with actual homepage sections:
 *   welcome, books, courses, why
 *
 * (FAQ, Campus, and Corporate were removed from the homepage in favour
 * of a focused English-learning message.)
 */
export const navigation = [
  { id: "home", label: "خانه" },
  { id: "courses", label: "درس‌ها" },
] as const;

export type NavItem = (typeof navigation)[number];

/** Header CTA — short and clear for students. */
export const headerCta = {
  label: "شروع یادگیری",
  href: "/courses",
} as const;
