import type { Course, CourseCategory } from "./types";

/**
 * Course categories — English-language skills only.
 *   grammar     → قواعد دستوری
 *   vocabulary  → لغات و دایره واژگان
 *   reading     → خواندن و درک مطلب
 *   listening   → شنیدن
 *   writing     → نوشتن
 *   ielts       → آمادگی آزمون آیلتس
 */
export const courseCategories: CourseCategory[] = [
  { id: "all", label: "همه دوره‌ها" },
  { id: "grammar", label: "گرامر" },
  { id: "vocabulary", label: "واژگان" },
  { id: "reading", label: "خواندن" },
  { id: "listening", label: "شنیدن" },
  { id: "writing", label: "نوشتن" },
  { id: "ielts", label: "آیلتس" },
];

/**
 * English-only courses for Persian-speaking learners.
 * Each course focuses on a specific language skill (no فن بیان / rhetoric).
 */
export const courses: Course[] = [
  {
    id: "english-zero",
    title: "انگلیسی از صفر",
    subtitle: "حروف الفبا، کلمات پایه و اولین جمله‌ها",
    category: "grammar",
    level: "مبتدی مطلق",
    mentor: "خانم سارا محمدی",
    mentorInitial: "س",
    rating: 4.9,
    reviews: 2148,
    durationHours: 18,
    lessons: 64,
    price: 850000,
    originalPrice: 1200000,
    bestseller: true,
    accent: "violet",
    glyph: "📘",
  },
  {
    id: "grammar-a1",
    title: "گرامر پایه A1",
    subtitle: "زمان حال ساده، افعال to be، ضمایر",
    category: "grammar",
    level: "مقدماتی",
    mentor: "آقای رضا کریمی",
    mentorInitial: "ر",
    rating: 4.8,
    reviews: 1567,
    durationHours: 24,
    lessons: 82,
    price: 1200000,
    bestseller: true,
    accent: "pink",
    glyph: "✏️",
  },
  {
    id: "vocabulary-daily",
    title: "واژگان روزمره",
    subtitle: "۱۰۰۰ لغت پرکاربرد با مثال واقعی",
    category: "vocabulary",
    level: "مقدماتی تا متوسط",
    mentor: "خانم نگار احمدی",
    mentorInitial: "ن",
    rating: 4.9,
    reviews: 932,
    durationHours: 16,
    lessons: 48,
    price: 980000,
    accent: "orchid",
    glyph: "📚",
  },
  {
    id: "listening-practice",
    title: "تمرین شنیدن",
    subtitle: "دیالوگ‌های واقعی از سطح A1 تا B1",
    category: "listening",
    level: "مقدماتی تا متوسط",
    mentor: "آقای امیر حسینی",
    mentorInitial: "ا",
    rating: 4.7,
    reviews: 1203,
    durationHours: 20,
    lessons: 70,
    price: 1100000,
    originalPrice: 1400000,
    accent: "blue",
    glyph: "🎧",
  },
  {
    id: "reading-stories",
    title: "داستان‌خوانی انگلیسی",
    subtitle: "داستان‌های کوتاه سطح‌بندی‌شده برای تقویت درک مطلب",
    category: "reading",
    level: "مقدماتی تا متوسط",
    mentor: "خانم نگار احمدی",
    mentorInitial: "ن",
    rating: 4.8,
    reviews: 814,
    durationHours: 22,
    lessons: 58,
    price: null,
    accent: "pink",
    glyph: "📖",
  },
  {
    id: "ielts-prep",
    title: "آمادگی آیلتس",
    subtitle: "تکنیک‌های ۴ مهارت + آزمون شبیه‌سازی",
    category: "ielts",
    level: "پیشرفته",
    mentor: "خانم سارا محمدی",
    mentorInitial: "س",
    rating: 5.0,
    reviews: 645,
    durationHours: 28,
    lessons: 96,
    price: 1650000,
    accent: "amber",
    glyph: "🎯",
  },
];

/**
 * Card accents — kid-friendly palette driven by color psychology.
 *
 *   sky      → trust, open mind, "I can start"
 *   coral    → warmth, "I'm safe here"
 *   mint     → growth, "I learned something new"
 *   sunny    → joy, achievement, "I did it!"
 *   lavender → imagination, creativity
 *
 * The 6th slot (peach) is mapped to the existing `blue` key for
 * backwards-compat with rows that already use it.
 */
export const accentClasses: Record<Course["accent"], string> = {
  // sky = trust, imagination
  violet: "from-kid-sky-200/50 to-kid-sky-50/10 text-kid-sky-600",
  // coral = warmth, friendliness
  pink: "from-kid-coral-200/50 to-kid-coral-50/10 text-kid-coral-600",
  // mint = growth, freshness
  orchid: "from-kid-mint-200/50 to-kid-mint-50/10 text-kid-mint-600",
  // sunny = joy, optimism
  amber: "from-kid-sunny-200/50 to-kid-sunny-50/10 text-kid-sunny-600",
  // lavender = imagination (peach fallback)
  blue: "from-kid-lavender-200/50 to-kid-lavender-50/10 text-kid-lavender-600",
};
