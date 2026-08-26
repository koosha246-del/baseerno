"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * NotificationBadge — shows a bell icon with unread count for logged-in users.
 * Only visible when the user is authenticated and has unread notifications.
 */
export function NotificationBadge() {
  const [count, setCount] = useState(0);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Check auth first
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) return;
        if (cancelled) return;
        setAuthed(true);

        // Then fetch notification count
        return fetch("/api/notifications?unreadOnly=true", { cache: "no-store" });
      })
      .then((r) => r?.json())
      .then((data) => {
        if (!cancelled && data?.count) {
          setCount(data.count);
        }
      })
      .catch(() => {
        // Silently ignore — badge just won't show
      });

    return () => { cancelled = true; };
  }, []);

  if (!authed || count === 0) return null;

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      aria-label={`${count} اعلان خوانده نشده`}
      className="relative text-fg-secondary hover:text-fg-primary"
    >
      <a href="/dashboard/notifications">
        <Bell className="size-5" />
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center",
            "rounded-full bg-kid-coral-500 text-[0.6rem] font-bold text-white",
            "ring-2 ring-background"
          )}
        >
          {count > 9 ? "۹+" : count}
        </span>
      </a>
    </Button>
  );
}
