import type { Metadata } from "next";
import { libraryBooks } from "@/lib/library";
import { buildPageMetadata } from "@/lib/seo";
import { LibraryClient } from "./LibraryClient";

export const metadata: Metadata = buildPageMetadata({
  title: "کتابخانه",
  description:
    "کتاب‌های تدریس‌شده در آکادمی بصیر نو — منابع اصلی دوره‌های زبان انگلیسی برای دانلود.",
  path: "/library",
});

export default function LibraryPage() {
  return <LibraryClient books={libraryBooks} />;
}
