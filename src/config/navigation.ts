/**
 * Navigation configuration — section ids + simple Persian labels for students.
 * Section ids must match homepage section `id` attributes.
 */
export const navigation = [
  { id: "home", label: "خانه" },
  { id: "courses", label: "درس‌ها" },
  { id: "corporate", label: "کلاس گروهی" },
  { id: "campus", label: "فضای یادگیری" },
  { id: "faq", label: "سوالات" },
] as const;

export type NavItem = (typeof navigation)[number];

/** Header CTA — short and clear for students. */
export const headerCta = {
  label: "شروع یادگیری",
  href: "#courses",
} as const;
