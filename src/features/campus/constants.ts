import type { CampusFeature, CampusGalleryItem } from "./types";

export const campusFeatures: CampusFeature[] = [
  {
    id: "studio",
    title: "اتاق تمرین حرف زدن",
    description: "جایی آرام برای تمرین تلفظ و مکالمه انگلیسی.",
    accent: "violet",
    glyph: "🎙️",
  },
  {
    id: "library",
    title: "قفسه کتاب و داستان",
    description: "کتاب‌ها و داستان‌های کوتاه انگلیسی برای سن دانش‌آموز.",
    accent: "pink",
    glyph: "📚",
  },
  {
    id: "cafe",
    title: "گوشه دوستی",
    description: "جایی برای حرف زدن با دوستان و تمرین با هم.",
    accent: "orchid",
    glyph: "☕",
  },
  {
    id: "mentorship",
    title: "کمک معلم",
    description: "وقت خصوصی با معلم برای سوال‌های سخت و پیشرفت بهتر.",
    accent: "amber",
    glyph: "🤝",
  },
];

export const campusGallery: CampusGalleryItem[] = [
  { id: "g1", label: "سالن اصلی", aspect: "tall", accent: "violet" },
  { id: "g2", label: "کلاس درس", aspect: "square", accent: "pink" },
  { id: "g3", label: "اتاق تمرین", aspect: "wide", accent: "orchid" },
  { id: "g4", label: "کتابخانه", aspect: "square", accent: "amber" },
  { id: "g5", label: "میز کار", aspect: "tall", accent: "blue" },
  { id: "g6", label: "روز ویژه", aspect: "wide", accent: "violet" },
];

/** Soft blues & ambers — calm focus + warm joy for kids. */
export const campusAccentMap: Record<string, string> = {
  violet: "from-blue-600/30 to-blue-400/10",
  pink: "from-amber-300/30 to-amber-100/10",
  orchid: "from-sky-400/30 to-sky-200/10",
  amber: "from-amber-200/40 to-amber-100/10",
  blue: "from-blue-200/40 to-blue-100/10",
};
