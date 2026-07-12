import type { CampusFeature, CampusGalleryItem } from "./types";

export const campusFeatures: CampusFeature[] = [
  {
    id: "studio",
    title: "استودیوی ضبط حرفه‌ای",
    description: "فضای مجهز برای تمرین و ضبط ارائه‌ها با دوربین و میکروفون حرفه‌ای.",
    accent: "violet",
    glyph: "🎬",
  },
  {
    id: "library",
    title: "کتابخانه تخصصی",
    description: "دسترسی به مجموعه‌ای از کتاب‌ها و منابع معتبر فن بیان و ارتباطات.",
    accent: "pink",
    glyph: "📚",
  },
  {
    id: "cafe",
    title: "فضای تعامل",
    description: "محیطی دنج برای شبکه‌سازی و گفتگوهای آزاد بین دانشجویان و اساتید.",
    accent: "orchid",
    glyph: "☕",
  },
  {
    id: "mentorship",
    title: "اتاق منتورینگ",
    description: "جلسات خصوصی با منتورها برای پیشرفت سریع و بازخورد شخصی‌سازی شده.",
    accent: "amber",
    glyph: "🤝",
  },
];

export const campusGallery: CampusGalleryItem[] = [
  { id: "g1", label: "سالن اصلی", aspect: "tall", accent: "violet" },
  { id: "g2", label: "کلاس سخنرانی", aspect: "square", accent: "pink" },
  { id: "g3", label: "استودیو", aspect: "wide", accent: "orchid" },
  { id: "g4", label: "کتابخانه", aspect: "square", accent: "amber" },
  { id: "g5", label: "فضای کاری", aspect: "tall", accent: "blue" },
  { id: "g6", label: "رویداد ویژه", aspect: "wide", accent: "violet" },
];

export const campusAccentMap: Record<string, string> = {
  violet: "from-blue-600/30 to-blue-400/10",
  pink: "from-amber-300/30 to-amber-100/10",
  orchid: "from-sky-400/30 to-sky-200/10",
  amber: "from-amber-200/40 to-amber-100/10",
  blue: "from-blue-200/40 to-blue-100/10",
};
