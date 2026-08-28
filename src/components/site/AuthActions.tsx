"use client";

import * as React from "react";
import Link from "next/link";
import { LayoutDashboard, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthActionsProps {
  /** desktop: لینک ظریف کنار CTA · mobile: دکمه پهن داخل منو */
  variant?: "desktop" | "mobile";
}

/**
 * AuthActions — ورود / پنل کاربری برای هدر لندینگ.
 *
 * یک probe سبک به /api/auth/me می‌زند تا بین «ورود» (ناشناس) و
 * «پنل کاربری» (وارد شده) سوییچ کند. تا پایان probe چیزی رندر
 * نمی‌شود تا پرش چیدمانی نداشته باشیم.
 */
export function AuthActions({ variant = "desktop" }: AuthActionsProps) {
  const [authed, setAuthed] = React.useState(false);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false))
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!checked) return null;

  return (
    <Link
      href={authed ? "/dashboard" : "/login"}
      className={cn(
        "flex items-center justify-center gap-2 font-semibold text-navy transition-colors hover:text-brand",
        variant === "desktop"
          ? "hidden rounded-xl border border-navy/15 px-4 py-2.5 text-[15px] hover:border-brand sm:inline-flex"
          : "flex-1 rounded-xl border border-navy/15 px-4 py-3 text-[15px] hover:border-brand",
      )}
    >
      {authed ? (
        <>
          <LayoutDashboard aria-hidden="true" className="size-4" />
          پنل کاربری
        </>
      ) : (
        <>
          <LogIn aria-hidden="true" className="size-4" />
          ورود
        </>
      )}
    </Link>
  );
}
