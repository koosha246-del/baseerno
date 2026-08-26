"use client";

import { useEffect, useState } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UserData {
  name: string;
  email: string;
}

/**
 * UserAvatarDropdown — shows user avatar with simple toggle menu when logged in.
 * Includes links to dashboard and logout.
 */
export function UserAvatarDropdown() {
  const [user, setUser] = useState<UserData | null>(null);
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (!cancelled && data) {
          setUser(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => { cancelled = true; };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick() { setMenuOpen(false); }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [menuOpen]);

  if (!checked || !user) return null;

  const initial = user.name?.charAt(0) || user.email?.charAt(0) || "?";

  return (
    <div className="relative hidden lg:block">
      <Button
        variant="ghost"
        size="sm"
        className="group gap-2 px-2"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white shadow-sm">
          {initial}
        </span>
        <ChevronDown className={cn(
          "size-3.5 text-fg-muted transition-transform",
          menuOpen && "rotate-180"
        )} />
      </Button>

      {menuOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-app-border bg-surface shadow-lg">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-fg-primary">{user.name}</p>
            <p className="text-xs text-fg-muted">{user.email}</p>
          </div>
          <div className="border-t border-app-border" />
          <a
            href="/dashboard"
            className="block px-3 py-2 text-sm text-fg-secondary hover:bg-surface-subtle"
          >
            پنل کاربری
          </a>
          <a
            href="/dashboard/certificates"
            className="block px-3 py-2 text-sm text-fg-secondary hover:bg-surface-subtle"
          >
            گواهی‌نامه‌ها
          </a>
          <a
            href="/dashboard/messages"
            className="block px-3 py-2 text-sm text-fg-secondary hover:bg-surface-subtle"
          >
            پیام‌ها
          </a>
          <div className="border-t border-app-border" />
          <a
            href="/api/auth/logout"
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-surface-subtle"
          >
            <LogOut className="size-4" />
            خروج
          </a>
        </div>
      )}
    </div>
  );
}
