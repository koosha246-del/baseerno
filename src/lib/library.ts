/**
 * Library catalog — taught books available for paid download.
 *
 * Book identities match the real covers shown on the landing page
 * (`src/lib/books-data.ts`) — do not rename or invent books.
 * Cover images are the real scans shipped under `public/images/`.
 */

import { cldImage } from "./image";

export interface Book {
  id: string;
  title: string;
  /** نوع کتاب مطابق نوشته روی جلد */
  subtitle?: string;
  /** نویسندگان واقعی کتاب */
  author?: string;
  level: string;
  description: string;
  price: number; // Tomans
  cover: string; // public path to the real cover scan (or Cloudinary public ID)
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
    cover: "/images/book-milestones-a.webp",
    file: "/images/book-milestones-a.webp",
    pages: 120,
  },
  {
    id: "genius-1",
    title: "Genius 1",
    subtitle: "3 in 1 · Student Book, Reader, Workbook",
    author: "Masoud Bahrami, Fereshteh Torkaman & Maryam Azarakhshi",
    level: "A1",
    description:
      "کتاب اول مجموعه Genius در سطح A1. شامل Student Book، کتابخوان (Readers) و کتاب تمرین برای یادگیری جامع زبان.",
    price: 280_000,
    cover: "/images/book-genius-1.webp",
    file: "/images/book-genius-1.webp",
    pages: 152,
  },
  {
    id: "ace-it-1",
    title: "ACE it! 1",
    subtitle: "Student Book",
    author: "Masoud Bahrami, Fereshteh Torkaman & Maryam Azarakhshi",
    level: "A1 – A2",
    description:
      "کتاب اول مجموعه Ace it! برای تقویت مهارت‌های چهارگانه زبان انگلیسی با رویکرد عملی و کاربردی.",
    price: 260_000,
    cover: "/images/book-ace-it-1.webp",
    file: "/images/book-ace-it-1.webp",
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
    cover: "/images/book-smart-english-2.webp",
    file: "/images/book-smart-english-2.webp",
    pages: 148,
  },
  {
    id: "smart-plus",
    title: "Smart Plus",
    subtitle: "3rd Student's Book & Workbook",
    author: "Masoud Bahrami, Fereshteh Torkaman & Maryam Azarakhshi",
    level: "A2 – B1",
    description:
      "مجموعه جامع Smart Plus همراه با سی‌دی آموزشی و دفتر تمرین؛ مناسب زبان‌آموزان برای تقویت هر چهار مهارت.",
    price: 300_000,
    cover: "/images/book-smart-plus.webp",
    file: "/images/book-smart-plus.webp",
    pages: 180,
  },
];

/** Get a book's cover image URL. Local paths pass through untouched;
 *  Cloudinary public IDs go through `cldImage()`. */
export function getBookCover(book: Book): string {
  if (book.cover.startsWith("/")) return book.cover;
  return cldImage(book.cover, { width: 400, height: 600, crop: "fit", quality: 80 });
}

export function findBook(id: string): Book | undefined {
  return libraryBooks.find((b) => b.id === id);
}

export function formatToman(amount: number): string {
  return amount.toLocaleString("fa-IR") + " تومان";
}
