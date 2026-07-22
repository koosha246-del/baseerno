/**
 * Library catalog — taught books available for paid download.
 *
 * For the demo, the "file" is the cover image itself. In production these
 * would point to real PDF / EPUB files hosted on Cloudinary or a private
 * bucket, gated behind signed download URLs.
 */

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  level: string;
  description: string;
  price: number; // Tomans
  cover: string; // public path to the cover image
  file: string; // public path to the actual downloadable file
  pages?: number;
}

export const libraryBooks: Book[] = [
  {
    id: "interchange-intro",
    title: "Interchange Intro",
    subtitle: "Student's Book (5th Edition)",
    author: "Jack C. Richards",
    level: "مقدماتی",
    description:
      "کتاب پایه برای شروع یادگیری زبان انگلیسی. مناسب افرادی که هیچ پیش‌زمینه‌ای ندارند.",
    price: 250_000,
    cover: "/library/interchange-intro.jpg",
    file: "/library/interchange-intro.jpg",
    pages: 144,
  },
  {
    id: "interchange-1",
    title: "Interchange 1",
    subtitle: "Student's Book (5th Edition)",
    author: "Jack C. Richards",
    level: "A1 – A2",
    description:
      "سطح اول مجموعه Interchange. گرامر و واژگان پایه برای مکالمه روزمره.",
    price: 280_000,
    cover: "/library/interchange-1.jpg",
    file: "/library/interchange-1.jpg",
    pages: 152,
  },
  {
    id: "interchange-2",
    title: "Interchange 2",
    subtitle: "Student's Book (5th Edition)",
    author: "Jack C. Richards",
    level: "A2 – B1",
    description:
      "سطح دوم مجموعه Interchange. تقویت مهارت مکالمه و listening در موقعیت‌های متنوع.",
    price: 280_000,
    cover: "/library/interchange-2.jpg",
    file: "/library/interchange-2.jpg",
    pages: 152,
  },
  {
    id: "interchange-3",
    title: "Interchange 3",
    subtitle: "Student's Book (5th Edition)",
    author: "Jack C. Richards",
    level: "B1 – B2",
    description:
      "سطح سوم مجموعه Interchange. گرامر پیشرفته‌تر و مهارت‌های ارتباطی حرفه‌ای.",
    price: 280_000,
    cover: "/library/interchange-3.jpg",
    file: "/library/interchange-3.jpg",
    pages: 152,
  },
  {
    id: "connect-series",
    title: "Connect Second Edition",
    subtitle: "مجموعه ۴ جلدی (Student's Book 1–4 + Teacher's Edition)",
    author: "Jack C. Richards & Carlos Barbisan",
    level: "A1 – B2",
    description:
      "مجموعه کامل ۴ جلدی Connect برای یادگیری ساختارمند زبان انگلیسی.",
    price: 450_000,
    cover: "/library/connect-series.jpg",
    file: "/library/connect-series.jpg",
    pages: 600,
  },
];

export function findBook(id: string): Book | undefined {
  return libraryBooks.find((b) => b.id === id);
}

export function formatToman(amount: number): string {
  return amount.toLocaleString("fa-IR") + " تومان";
}
