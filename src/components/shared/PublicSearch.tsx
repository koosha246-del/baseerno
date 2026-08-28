"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "course";
}

/**
 * PublicSearch — dropdown search bar for the site header.
 * Queries the Meilisearch-powered /api/search/courses endpoint
 * and displays results in an overlay dropdown.
 */
export function PublicSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Focus input when dropdown opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search with stale-response guard
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search/courses?q=${encodeURIComponent(query)}&take=5`,
          { signal: controller.signal },
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
        }
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          // network failure — keep previous results
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div ref={wrapperRef} className="relative hidden lg:block">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-app-border bg-surface px-3 py-1.5 text-sm text-fg-muted transition-colors hover:border-accent/40 hover:text-fg-secondary"
        aria-label="جستجو"
      >
        <Search className="size-4" />
        <span className="hidden xl:inline">جستجو...</span>
      </button>

      {open ? (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 overflow-hidden rounded-xl border border-app-border bg-surface shadow-xl">
          <div className="flex items-center gap-2 border-b border-app-border-subtle px-3">
            <Search className="size-4 shrink-0 text-fg-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی دوره..."
              dir="rtl"
              className="h-10 flex-1 bg-transparent text-sm text-fg-primary outline-none placeholder:text-fg-muted"
            />
            <button
              onClick={() => {
                setOpen(false);
                setQuery("");
                setResults([]);
              }}
              className="text-fg-muted hover:text-fg-primary"
            >
              <X className="size-4" />
            </button>
          </div>

          {results.length > 0 ? (
            <nav className="max-h-64 overflow-y-auto p-1">
              {results.map((r) => (
                <a
                  key={r.id}
                  href={`/courses/${r.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent/10"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-fg-primary">{r.title}</p>
                    {r.subtitle ? (
                      <p className="truncate text-xs text-fg-muted">{r.subtitle}</p>
                    ) : null}
                  </div>
                  <ArrowLeft className="size-4 shrink-0 text-fg-muted" />
                </a>
              ))}
            </nav>
          ) : query.length >= 2 && !loading ? (
            <p className="px-4 py-6 text-center text-sm text-fg-muted">نتیجه‌ای یافت نشد</p>
          ) : loading ? (
            <p className="px-4 py-6 text-center text-sm text-fg-muted">در حال جستجو...</p>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-fg-muted">حداقل ۲ کاراکتر وارد کنید</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
