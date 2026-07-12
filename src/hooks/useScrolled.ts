"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether the window has scrolled past `threshold` (px).
 * Used by the header to toggle its glass / elevated state.
 */
export function useScrolled(threshold = 12): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
