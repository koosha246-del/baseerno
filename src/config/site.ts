/**
 * Central site configuration — typed, editable, the single place to change
 * brand identity, contact info, and navigation.
 *
 * Focus: ONLY English language learning (grammar, vocabulary, reading,
 * listening, writing, IELTS). No rhetoric / communication / فن بیان.
 * Audience: Persian-speaking learners — kids, teens, adults.
 */
export const siteConfig = {
  name: "بصیر نو",
  nameEn: "Baseer No",
  shortName: "بصیر نو",
  tagline: "یادگیری زبان انگلیسی، قدم به قدم",
  description:
    "بصیر نو یک آموزشگاه زبان انگلیسی برای کودکان و نوجوانان است؛ از شروع مسیر تا سطوح بالاتر با کتاب‌های واقعی تدریس‌شده (ACE it!، Smart English، Smart Plus، Milestones، Genius).",
  url: "https://baseerno.ir",
  locale: "fa_IR",
  lang: "fa",
  dir: "rtl" as const,
  foundedYear: 1398,
  contact: {
    email: "info@baseerno.ir",
    phone: "۰۹۳۰-۷۷۲-۵۴۸۴",
    phoneHref: "+989307725484",
    address: "تهران، خیابان ولیعصر، برج پارسیان، طبقه ۸",
  },
  social: {
    instagram: "https://instagram.com/baseerno",
    telegram: "https://t.me/baseerno",
    youtube: "https://youtube.com/@baseerno",
    linkedin: "https://linkedin.com/company/baseerno",
    aparat: "https://aparat.com/baseerno",
  },
} as const;

export type SiteConfig = typeof siteConfig;
