"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  GraduationCap,
  Phone,
  LayoutDashboard,
  LogIn,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { headerData, headerPhone } from "../constants";
import type { HeaderCtaIconKey } from "../types";

const iconMap: Record<HeaderCtaIconKey, LucideIcon> = {
  "graduation-cap": GraduationCap,
  phone: Phone,
};

/**
 * HeaderActions — desktop CTA cluster.
 * Phone contact + dashboard/login link + primary gradient registration CTA.
 * RTL: arrow points left (forward direction in RTL).
 */
export function HeaderActions() {
  const { cta } = headerData;
  const CtaIcon = cta.iconKey ? iconMap[cta.iconKey] : null;

  // Detect auth state on the client to toggle between "ورود" and "پنل کاربری".
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
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

  return (
    <div className="flex items-center gap-2">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="hidden text-fg-secondary lg:inline-flex"
      >
        <a href={headerPhone.href} dir="ltr">
          <Phone className="size-4" />
          <span className="font-medium">{headerPhone.display}</span>
        </a>
      </Button>

      {/* Dashboard / Login link — only rendered after the auth check completes */}
      {checked ? (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="group/btn"
        >
          <a href={authed ? "/dashboard" : "/login"}>
            {authed ? (
              <>
                <LayoutDashboard className="size-4" />
                <span className="hidden sm:inline">پنل کاربری</span>
              </>
            ) : (
              <>
                <LogIn className="size-4" />
                <span className="hidden sm:inline">ورود</span>
              </>
            )}
          </a>
        </Button>
      ) : null}

      <Button asChild variant="brand" size="sm" className="shadow-glow group/btn">
        <a href={cta.href}>
          {CtaIcon ? <CtaIcon className="size-4" /> : null}
          <span>{cta.label}</span>
          <ArrowLeft className="size-4 transition-transform duration-base ease-luxury group-hover/btn:-translate-x-0.5" />
        </a>
      </Button>
    </div>
  );
}
