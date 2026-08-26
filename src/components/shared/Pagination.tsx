"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format";
import { useT } from "@/lib/i18n";

interface PaginationProps {
  /** Total number of records across all pages. */
  total: number;
  /** Page size (records per page). */
  pageSize: number;
  /** Current page, 1-based. */
  currentPage: number;
  /** Query-string key to use for the page parameter. */
  paramName?: string;
  /** Optional sibling query params to preserve when navigating. */
  preserve?: Record<string, string | undefined>;
}

/**
 * URL-driven pagination. Renders nothing if there is only one page.
 *
 * The page is read from / written to a `page` (or `paramName`) query
 * string. All other params are preserved so filters survive a click.
 */
export function Pagination({
  total,
  pageSize,
  currentPage,
  paramName = "page",
  preserve,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { t } = useT();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function go(target: number) {
    const clamped = Math.max(1, Math.min(totalPages, target));
    if (clamped === currentPage) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [k, v] of Object.entries(preserve ?? {})) {
      if (v === undefined) params.delete(k);
      else params.set(k, v);
    }
    if (clamped === 1) params.delete(paramName);
    else params.set(paramName, String(clamped));
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  // Build a compact page list: 1 … (current-1) current (current+1) … last
  const pages: Array<number | "ellipsis"> = [];
  const add = (p: number | "ellipsis") => {
    if (pages[pages.length - 1] !== p) pages.push(p);
  };
  add(1);
  if (currentPage > 3) add("ellipsis");
  for (let p = currentPage - 1; p <= currentPage + 1; p++) {
    if (p > 1 && p < totalPages) add(p);
  }
  if (currentPage < totalPages - 2) add("ellipsis");
  if (totalPages > 1) add(totalPages);

  return (
    <nav
      dir="rtl"
      aria-label="صفحه‌بندی"
      className={cn(
        "flex flex-wrap items-center justify-center gap-1.5 text-sm",
        isPending && "opacity-60 transition-opacity",
      )}
    >
      {/* In RTL: "قبلی" (Previous) appears on the right and its
          chevron points right (the direction of going back in
          RTL reading order). */}
      <button
        type="button"
        onClick={() => go(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="صفحه قبلی"
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-app-border-subtle bg-surface px-3 text-fg-primary transition-colors hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
        {t("common.prev")}
      </button>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`e-${i}`}
            className="inline-flex h-9 w-9 items-center justify-center text-fg-muted"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            aria-current={p === currentPage ? "page" : undefined}
            aria-label={`${t("common.page")} ${toPersianDigits(p)}`}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 transition-colors",
              p === currentPage
                ? "border-accent bg-accent text-white shadow-sm"
                : "border-app-border-subtle bg-surface text-fg-primary hover:border-accent/40",
            )}
          >
            {toPersianDigits(p)}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label={`${t("common.next")}`}
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-app-border-subtle bg-surface px-3 text-fg-primary transition-colors hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("common.next")}
        <ChevronLeft className="size-4" />
      </button>

      <span className="ms-3 text-xs text-fg-secondary">
        {t("common.page")} {toPersianDigits(currentPage)} {t("common.pageOf")} {toPersianDigits(totalPages)}
      </span>
    </nav>
  );
}
