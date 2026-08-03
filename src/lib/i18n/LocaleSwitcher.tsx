/**
 * LocaleSwitcher — toggles between Persian and English.
 *
 * Renders as a small toggle button in the header so users can switch
 * the UI language. Persists the choice in localStorage.
 *
 * Usage:
 * ```tsx
 * import { LocaleSwitcher } from "@/lib/i18n/LocaleSwitcher";
 *
 * <header>
 *   <LocaleSwitcher />
 * </header>
 * ```
 */

"use client";

import { Languages } from "lucide-react";
import { useLocale } from "./index";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "fa" ? "en" : "fa")}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-fg-secondary transition-colors hover:bg-surface-muted hover:text-fg-primary"
      aria-label={locale === "fa" ? "تغییر زبان به انگلیسی" : "Switch to Persian"}
    >
      <Languages className="size-3.5" />
      <span className="font-bold">{locale === "fa" ? "EN" : "FA"}</span>
    </button>
  );
}
