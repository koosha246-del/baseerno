"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

interface LogoProps {
  className?: string;
  showSub?: boolean;
  /** Compact variant for tight spaces (mobile). */
  compact?: boolean;
}

/**
 * Logo — brand mark + wordmark.
 * Uses the actual brand logo image.
 */
export function Logo({ className, showSub = true, compact = false }: LogoProps) {
  return (
    <a
      href="#home"
      className={cn("group flex items-center gap-2.5", className)}
      aria-label={`${siteConfig.name} — ${siteConfig.tagline}`}
    >
      <Image
        src="/logo.png"
        alt={`${siteConfig.name} logo`}
        width={compact ? 36 : 44}
        height={compact ? 36 : 44}
        priority
        className="h-auto w-auto object-contain transition-transform duration-slow ease-luxury group-hover:scale-105"
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-extrabold tracking-tight text-fg-primary">
          {siteConfig.name}
        </span>
        {showSub && !compact ? (
          <span className="mt-0.5 text-[0.65rem] font-medium text-fg-secondary">
            {siteConfig.tagline}
          </span>
        ) : null}
      </span>
    </a>
  );
}
