/**
 * Library catalog — taught books available for paid download.
 *
 * Image URLs use `cldImage()` to serve from Cloudinary when configured,
 * falling back to local paths for development.
 */

import { cldImage } from "./image";

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  level: string;
  description: string;
  price: number; // Tomans
  cover: string; // Cloudinary public ID (e.g. "library/milestones-a")
  file: string; // public path to the actual downloadable file
  pages?: number;
}

export const libraryBooks: Book[] = [
  {
    id: "milestones-a",
    title: "Milestones A",
    subtitle: "Student Book with Workbook",
    author: "Fereshteh Torkaman & Masoud Bahrami",
    level: "مقدماتی",
    description:
      "کتاب پایه مجموعه Milestones برای شروع یادگیری زبان انگلیسی. شامل تمرین‌ها و تکالیف تعاملی برای تثبیت مفاهیم پایه.",
    price: 250_000,
    cover: "library/milestones-a",
    file: "/library/milestones-a.jpg",
    pages: 120,
  },
  {
    id: "genius-1",
    title: "Genius 1",
    subtitle: "Student Book • Readers • Workbook",
    author: "Masoud Bahrami, Fereshteh Torkaman & Maryam Azarakhshi",
    level: "A1",
    description:
      "کتاب اول مجموعه Genius در سطح A1. شامل Student Book، کتابخوان (Readers) و کتاب تمرین برای یادگیری جامع زبان.",
    price: 280_000,
    cover: "library/genius-1",
    file: "/library/genius-1.jpg",
    pages: 152,
  },
  {
    id: "ace-it-1",
    title: "Ace it! 1",
    subtitle: "Student Book",
    author: "Masoud Bahrami, Fereshteh Torkaman & Maryam Azarakhshi",
    level: "A1 – A2",
    description:
      "کتاب اول مجموعه Ace it! برای تقویت مهارت‌های چهارگانه زبان انگلیسی با رویکرد عملی و کاربردی.",
    price: 260_000,
    cover: "library/ace-it-1",
    file: "/library/ace-it-1.jpg",
    pages: 140,
  },
  {
    id: "smart-english-2",
    title: "Smart English 2",
    subtitle: "Student Book with Workbook",
    author: "Fereshteh Torkaman & Masoud Bahrami",
    level: "A1 – A2",
    description:
      "کتاب دوم مجموعه Smart English با تمرکز بر مکالمه روزمره و واژگان کاربردی در موقعیت‌های واقعی.",
    price: 270_000,
    cover: "library/smart-english-2",
    file: "/library/smart-english-2.jpg",
    pages: 148,
  },
  {
    id: "smart-plus",
    title: "Smart plus",
    subtitle: "Student Book • Readers • Notebook",
    author: "Masoud Bahrami, Fereshteh Torkaman & Maryam Azarakhshi",
    level: "A2 – B1",
    description:
      "مجموعه جامع Smart plus شامل کتاب درسی، کتابخوان و دفتر تمرین. مناسب زبان‌آموزان سطح متوسط برای تقویت هر چهار مهارت.",
    price: 300_000,
    cover: "library/smart-plus",
    file: "/library/smart-plus.jpg",
    pages: 180,
  },
];

/** Get a book's cover image URL (Cloudinary CDN or local fallback). */
export function getBookCover(book: Book): string {
  return cldImage(book.cover, { width: 400, height: 600, crop: "fit", quality: 80 });
}

export function findBook(id: string): Book | undefined {
  return libraryBooks.find((b) => b.id === id);
}

export function formatToman(amount: number): string {
  return amount.toLocaleString("fa-IR") + " تومان";
}
