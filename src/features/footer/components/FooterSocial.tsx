"use client";

import {
  Instagram,
  Send,
  Youtube,
  Linkedin,
  Tv,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { footerSocials } from "../constants";
import type { FooterSocialPlatform } from "../types";

const iconMap: Record<FooterSocialPlatform, LucideIcon> = {
  instagram: Instagram,
  telegram: Send,
  youtube: Youtube,
  linkedin: Linkedin,
  aparat: Tv,
};

/**
 * FooterSocial — social icon links row.
 * Resolves icons client-side to keep the data layer serializable.
 */
export function FooterSocial({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {footerSocials.map((s) => {
        const Icon = iconMap[s.id];
        return (
          <a
            key={s.id}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.platform}
            className="flex size-10 items-center justify-center rounded-xl border border-app-border-subtle bg-surface-subtle text-fg-secondary transition-all duration-base ease-luxury hover:-translate-y-0.5 hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
          >
            <Icon className="size-5" />
          </a>
        );
      })}
    </div>
  );
}
