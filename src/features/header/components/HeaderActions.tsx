"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { headerData, headerPhone } from "../constants";
import { UserAvatarDropdown } from "./UserAvatarDropdown";

/**
 * HeaderActions — desktop CTA cluster.
 * Phone contact + user avatar dropdown (logged in) or login button (logged out) + primary gradient registration CTA.
 * RTL: arrow points left (forward direction in RTL).
 */
export function HeaderActions() {
  const { cta } = headerData;
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
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Phone — desktop only */}
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

      {/* Show UserAvatarDropdown when logged in, otherwise show login button */}
      {checked ? (
        authed ? (
          <div className="hidden lg:block">
            <UserAvatarDropdown />
          </div>
        ) : (
          <Button
            asChild
            variant="brand"
            size="sm"
            className="shadow-glow group/btn"
          >
            <a href={cta.href}>
              <span>{cta.label}</span>
              <ArrowLeft className="size-4 transition-transform duration-base ease-luxury group-hover/btn:-translate-x-0.5" />
            </a>
          </Button>
        )
      ) : null}
    </div>
  );
}
