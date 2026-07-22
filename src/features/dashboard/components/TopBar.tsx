"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchResults } from "./SearchResults";
import { NotificationDropdown } from "./NotificationDropdown";

interface SearchResult {
  type: "course" | "message" | "user";
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

interface TopBarProps {
  onMenuToggle: () => void;
  userName: string;
  role: string;
  userId: string;
}

export function TopBar({ onMenuToggle, userName, role, userId }: TopBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const roleLabel =
    role === "STUDENT"
      ? "دانش‌آموز"
      : role === "TEACHER"
        ? "معلم"
        : "مدیر";

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-slate-900 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-300 hover:bg-white/5 hover:text-white lg:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="size-5" />
        </Button>

        <div ref={wrapperRef} className="relative hidden sm:block">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <Search className="size-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="جستجوی دوره، پیام، کاربر..."
              className="w-48 bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none lg:w-64"
              dir="rtl"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {open && (
            <div className="absolute left-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-lg border border-white/10 bg-slate-800 shadow-xl">
              {loading ? (
                <div className="px-4 py-6 text-center text-sm text-slate-400">
                  در حال جستجو...
                </div>
              ) : (
                <SearchResults results={results} onSelect={() => setOpen(false)} />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full bg-accent px-3 py-1 text-[0.7rem] font-bold text-white">
          {roleLabel}
        </span>

        <NotificationDropdown userId={userId} />

        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            {userName.charAt(0)}
          </div>
          <span className="hidden text-sm font-medium text-white sm:block">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
