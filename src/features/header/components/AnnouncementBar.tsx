"use client";

import { X, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { announcement } from "../constants";

const toneMap = {
  sky: "bg-kid-sky-50 text-kid-sky-700 dark:bg-kid-sky-500/15 dark:text-kid-sky-300",
  coral: "bg-kid-coral-50 text-kid-coral-700 dark:bg-kid-coral-500/15 dark:text-kid-coral-300",
  mint: "bg-kid-mint-50 text-kid-mint-700 dark:bg-kid-mint-500/15 dark:text-kid-mint-300",
  sunny: "bg-kid-sunny-50 text-kid-sunny-700 dark:bg-kid-sunny-500/15 dark:text-kid-sunny-300",
  lavender: "bg-kid-lavender-50 text-kid-lavender-700 dark:bg-kid-lavender-500/15 dark:text-kid-lavender-300",
} as const;

/**
 * AnnouncementBar — thin promotional banner above the main header.
 * Dismissible with an X button; state persisted in sessionStorage.
 */
export function AnnouncementBar() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("announcement-dismissed") !== "true";
  });

  if (!announcement || !visible) return null;

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem("announcement-dismissed", "true");
  }

  const content = (
    <span className="flex items-center justify-center gap-2 text-sm font-semibold">
      <span>{announcement.text}</span>
      {announcement.href && (
        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
      )}
    </span>
  );

  return (
    <div
      className={cn(
        "relative w-full py-2 text-center transition-colors",
        toneMap[announcement.tone]
      )}
    >
      {announcement.href ? (
        <a
          href={announcement.href}
          className="group block"
        >
          {content}
        </a>
      ) : (
        content
      )}
      <button
        onClick={dismiss}
        aria-label="بستن اعلان"
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
