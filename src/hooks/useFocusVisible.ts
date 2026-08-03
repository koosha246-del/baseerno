"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether the user is navigating via keyboard.
 *
 * When true, you can show strong focus outlines for keyboard users
 * while keeping them hidden for mouse users (`:focus-visible` polyfill).
 *
 * Usage:
 * ```tsx
 * const isKeyboard = useFocusVisible();
 * <div className={isKeyboard ? "ring-2 ring-accent" : ""} />
 * ```
 */
export function useFocusVisible(): boolean {
  const [isKeyboard, setIsKeyboard] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Tab" || e.key.startsWith("Arrow")) {
        setIsKeyboard(true);
      }
    }
    function handleMouseDown() {
      setIsKeyboard(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return isKeyboard;
}
