import Link from "next/link";
import { Database, ArrowRight } from "lucide-react";

interface DemoUnavailableCardProps {
  title?: string;
  description?: string;
}

/**
 * Friendly "database unavailable" card rendered by DB-backed dashboard
 * pages in demo mode (no PostgreSQL).
 *
 * Server component — safe to return from a server page inside a Suspense
 * boundary, where the client (dashboard)/error.tsx boundary can't trigger
 * during streaming. Keeps the whole dashboard navigable without a DB.
 */
export function DemoUnavailableCard({
  title = "دیتابیس در دسترس نیست",
  description = "این بخش به داده‌های ذخیره‌شده نیاز دارد. در حالت دمو، دیتابیس وصل نیست — پس از راه‌اندازی PostgreSQL همه‌ی بخش‌ها فعال می‌شوند.",
}: DemoUnavailableCardProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-slate-800/40 p-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
        <Database className="size-7" />
      </span>
      <h2 className="text-xl font-extrabold text-white">{title}</h2>
      <p className="max-w-md text-sm leading-loose text-slate-400">{description}</p>
      <Link
        href="/dashboard"
        className="mt-2 flex items-center gap-1.5 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/5"
      >
        <ArrowRight className="size-4" />
        بازگشت به داشبورد
      </Link>
    </div>
  );
}
