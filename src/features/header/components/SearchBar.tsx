"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * SearchBar — compact search input in the header.
 * Expands on click/focus and navigates to /courses?q={query} on submit.
 */
export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/courses?q=${encodeURIComponent(query.trim())}`;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div className="relative hidden lg:block">
      {open ? (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="جستجوی دوره..."
              className="w-56 rounded-xl border border-app-border bg-surface py-2 pr-9 pl-8 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => { setOpen(false); setQuery(""); }}
            className="size-8 text-fg-muted"
          >
            <X className="size-4" />
          </Button>
        </form>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="جستجو"
          className="text-fg-secondary hover:text-fg-primary"
        >
          <Search className="size-5" />
        </Button>
      )}
    </div>
  );
}
