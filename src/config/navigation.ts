/**
 * Navigation configuration — section ids + Persian labels.
 * Used by the header (desktop + mobile) and active-section scroll-spy.
 *
 * Section ids match the `id` attributes rendered on each homepage section
 * so smooth-scroll + IntersectionObserver scroll-spy stay in sync.
 */
export const navigation = [
  { id: "home", label: "خانه" },
  { id: "courses", label: "دوره‌ها" },
  { id: "corporate", label: "آموزش سازمانی" },
  { id: "campus", label: "محیط آکادمی" },
  { id: "faq", label: "سوالات متداول" },
] as const;

export type NavItem = (typeof navigation)[number];

/** The CTA target in the header — registration / contact. */
export const headerCta = {
  label: "ثبت‌نام دوره",
  href: "#courses",
} as const;
