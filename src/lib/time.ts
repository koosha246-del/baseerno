/**
 * Relative time helpers — Persian labels for dashboard UI.
 */

import { toPersianDigits } from "@/lib/format";

/**
 * Human-readable relative time in Persian.
 *
 * Examples: «همین الان»، «۵ دقیقه پیش»، «۲ ساعت پیش»، «۳ روز پیش»
 */
export function timeAgo(date: string | Date | number): string {
  const ts = typeof date === "number" ? date : new Date(date).getTime();
  if (Number.isNaN(ts)) return "—";

  const diff = Date.now() - ts;
  if (diff < 0) return "همین الان";

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "همین الان";
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه پیش`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toPersianDigits(hours)} ساعت پیش`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${toPersianDigits(days)} روز پیش`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${toPersianDigits(months)} ماه پیش`;

  const years = Math.floor(days / 365);
  return `${toPersianDigits(years)} سال پیش`;
}
