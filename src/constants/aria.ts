/**
 * Shared aria labels — Persian text for screen readers.
 * Centralized so accessibility copy stays consistent and editable.
 */
export const aria = {
  /** Main content skip-link target label. */
  mainContent: "محتوای اصلی",
  /** Open mobile navigation. */
  openNav: "باز کردن منو",
  /** Close mobile navigation. */
  closeNav: "بستن منو",
  /** Mobile navigation region label. */
  mobileNav: "ناوبری موبایل",
  /** Desktop navigation region label. */
  desktopNav: "ناوبری اصلی",
  /** Course registration button (prefixed per-course). */
  courseRegister: "ثبت‌نام در دوره",
  /** Expand FAQ item. */
  faqExpand: "باز کردن پاسخ",
  /** Submit consultation form. */
  submitConsultation: "ارسال درخواست مشاوره",
  /** Newsletter subscription. */
  newsletterSubscribe: "اشتراک در خبرنامه",
} as const;
