"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Database, ArrowRight } from "lucide-react";

/**
 * Dashboard segment error boundary.
 *
 * Catches any error thrown inside /dashboard/* pages (typically a failed
 * database query) and shows a friendly, actionable Persian message instead
 * of the global error page. In demo mode (no PostgreSQL) this makes the
 * whole dashboard navigable: the overview works, other sections explain
 * that they need the database.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the real error server-side / to the console — never show it.
    console.error("[dashboard] segment error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-slate-800/40 p-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
        <Database className="size-7" />
      </span>
      <h2 className="text-xl font-extrabold text-white">دیتابیس در دسترس نیست</h2>
      <p className="max-w-md text-sm leading-loose text-slate-400">
        این بخش به داده‌های ذخیره‌شده نیاز دارد. در حالت دمو، دیتابیس وصل نیست —
        می‌توانی به داشبورد برگردی یا دوباره تلاش کنی. پس از راه‌اندازی PostgreSQL
        همه‌ی بخش‌ها فعال می‌شوند.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-200"
        >
          تلاش دوباره
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/5"
        >
          <ArrowRight className="size-4" />
          بازگشت به داشبورد
        </Link>
      </div>
    </div>
  );
}
