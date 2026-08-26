"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * LanguageSwitcher — toggles between Persian (fa) and English (en).
 * Currently a UI placeholder; the actual i18n routing would be added
 * when the English locale is fully supported.
 */
export function LanguageSwitcher() {
  // For now, just show the current language indicator.
  // In the future, this will toggle between fa and en locales.
  const currentLang = "fa";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="تغییر زبان"
      className="text-fg-secondary hover:text-fg-primary"
      title={currentLang === "fa" ? "فارسی" : "English"}
    >
      <Globe className="size-5" />
      <span className="sr-only">
        {currentLang === "fa" ? "فارسی" : "English"}
      </span>
    </Button>
  );
}
