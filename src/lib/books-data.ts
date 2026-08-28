/**
 * ─────────────────────────────────────────────────────────────
 *  کتاب‌های آموزشی واقعی بصیر نو
 *  نام‌ها و سطوح دقیقاً مطابق تصاویر واقعی جلد کتاب‌هاست.
 *  از تغییر نام کتاب‌ها یا افزودن کتاب ساختگی خودداری کنید.
 * ─────────────────────────────────────────────────────────────
 */

export interface Book {
  id: string;
  /** نام روی جلد — دقیقاً همان‌طور که روی کتاب نوشته شده است */
  title: string;
  /** نوع کتاب، مطابق نوشته‌ی روی جلد */
  edition: string;
  /** توضیح کوتاه فارسی */
  description: string;
  /** سطح درج‌شده روی جلد (در صورت وجود) */
  levelLabel?: string;
  /** رنگ تأکیدی کارت */
  accent: "brand" | "sun" | "tang" | "leaf" | "navy";
  /** مسیر تصویر جلد واقعی */
  image: string;
  /** متن جایگزین تصویر */
  imageAlt: string;
}

export const books: Book[] = [
  {
    id: "ace-it-1",
    title: "ACE it! 1",
    edition: "Student Book",
    description: "کتاب دانش‌آموز برای شروعِ مسیر و آشنایی با زبان.",
    levelLabel: "Book 1",
    accent: "brand",
    image: "/images/book-ace-it-1.webp",
    imageAlt: "جلد کتاب ACE it! 1 — کتاب دانش‌آموز",
  },
  {
    id: "smart-english-2",
    title: "Smart English 2",
    edition: "Student Book with Workbook",
    description: "کتاب درسی همراه با تمرین؛ برای ادامه‌ی مسیر در سطح دوم.",
    levelLabel: "Level 2",
    accent: "tang",
    image: "/images/book-smart-english-2.webp",
    imageAlt: "جلد کتاب Smart English 2 — کتاب دانش‌آموز همراه با ورک‌بوک",
  },
  {
    id: "smart-plus",
    title: "Smart Plus",
    edition: "3rd Student's Book & Workbook",
    description: "سطح سوم مجموعه، همراه با سی‌دی آموزشی و تمرین.",
    levelLabel: "Level 3",
    accent: "sun",
    image: "/images/book-smart-plus.webp",
    imageAlt: "جلد کتاب Smart Plus — سطح سوم کتاب دانش‌آموز و ورک‌بوک",
  },
  {
    id: "milestones-a",
    title: "Milestones A",
    edition: "Student Book with Workbook",
    description: "یک نقطه‌ی عطف در مسیر یادگیری؛ درس و تمرین با هم.",
    levelLabel: "Level A",
    accent: "leaf",
    image: "/images/book-milestones-a.webp",
    imageAlt: "جلد کتاب Milestones A — کتاب دانش‌آموز همراه با ورک‌بوک",
  },
  {
    id: "genius-1",
    title: "Genius 1",
    edition: "3 in 1 · Student Book, Reader, Workbook",
    description: "درس، ریدر و تمرین؛ سه کتاب در یک جلد.",
    levelLabel: "A1",
    accent: "navy",
    image: "/images/book-genius-1.webp",
    imageAlt: "جلد کتاب Genius 1 — سه کارکرد در یک جلد، سطح A1",
  },
];

/** مراحل مسیر یادگیری — هر مرحله به یکی از کتاب‌های واقعی گره خورده است */
export interface JourneyStage {
  id: string;
  /** شماره مرحله به فارسی */
  faNumber: string;
  title: string;
  /** برچسب انگلیسی کوتاه مرحله */
  en: string;
  description: string;
  bookId: string;
  accent: Book["accent"];
}

export const journeyStages: JourneyStage[] = [
  {
    id: "start",
    faNumber: "۱",
    title: "شروع",
    en: "Start",
    description: "ورود به دنیای انگلیسی و ساخت پایه‌ی زبان.",
    bookId: "ace-it-1",
    accent: "brand",
  },
  {
    id: "base",
    faNumber: "۲",
    title: "پایه",
    en: "Base",
    description: "تثبیت مهارت‌های اولیه با درس و تمرین.",
    bookId: "smart-english-2",
    accent: "tang",
  },
  {
    id: "strengthen",
    faNumber: "۳",
    title: "تقویت",
    en: "Strengthen",
    description: "گسترده‌ترشدن مهارت‌ها در سطح سوم مسیر.",
    bookId: "smart-plus",
    accent: "sun",
  },
  {
    id: "progress",
    faNumber: "۴",
    title: "پیشرفت",
    en: "Progress",
    description: "رسیدن به یک نقطه‌ی عطف در یادگیری زبان.",
    bookId: "milestones-a",
    accent: "leaf",
  },
  {
    id: "higher",
    faNumber: "۵",
    title: "سطح بالاتر",
    en: "Higher",
    description: "تلفیق درس، ریدر و تمرین در یک کتاب.",
    bookId: "genius-1",
    accent: "navy",
  },
];
