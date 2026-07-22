import type { Metadata } from "next";
import { libraryBooks } from "@/lib/library";
import { LibraryClient } from "./LibraryClient";

export const metadata: Metadata = {
  title: "کتابخانه | آکادمی بصیر نو",
  description:
    "کتاب‌های تدریس‌شده در آکادمی بصیر نو — منابع اصلی دوره‌های زبان انگلیسی برای دانلود.",
};

export default function LibraryPage() {
  return <LibraryClient books={libraryBooks} />;
}
