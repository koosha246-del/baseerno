"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * FloatingThemeToggle — a FAB-style dark/light mode toggle that appears
 * after the user scrolls past the header (where the main ThemeToggle lives).
 *
 * Uses next-themes consistently so it never conflicts with the header toggle.
 * Syncs via resolvedTheme changes (next-themes handles the class/DOM).
 */
export function FloatingThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  const toggle = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  useEffect(() => {
    setMounted(true);

    const onScroll = () => setVisible(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "فعال‌سازی تم روشن" : "فعال‌سازی تم تاریک"}
      className={cn(
        "fixed bottom-6 left-6 z-[1500] flex size-12 items-center justify-center rounded-full shadow-lg transition-all duration-500 ease-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-4 scale-95 opacity-0 pointer-events-none",
        isDark
          ? "bg-brand-navy text-yellow-300 hover:bg-brand-navy/90 shadow-brand-navy/30"
          : "bg-accent text-white hover:bg-accent/90 shadow-accent/30"
      )}
    >
      {isDark ? (
        <Sun className="size-5 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="size-5 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
