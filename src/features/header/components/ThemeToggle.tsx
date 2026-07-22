"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * ThemeToggle — sun/moon icon toggle with a smooth rotate animation.
 *
 * - Reads the current theme from next-themes.
 * - Cycles: light → dark → light (no "system" state for the toggle).
 * - Mounts as a muted icon to avoid hydration mismatch.
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="تغییر تم"
        className="size-9 opacity-0"
        disabled
      >
        <Sun className="size-4" />
      </Button>
    );
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "فعال‌سازی تم روشن" : "فعال‌سازی تم تاریک"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group relative size-9 overflow-hidden rounded-full transition-colors duration-base",
        "text-fg-muted hover:bg-surface-subtle hover:text-fg-primary"
      )}
    >
      <span className="relative flex size-full items-center justify-center">
        <Sun
          className={cn(
            "size-4 transition-all duration-slow ease-spring",
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "absolute size-4 transition-all duration-slow ease-spring",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          )}
        />
      </span>
    </Button>
  );
}
