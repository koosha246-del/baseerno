"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: ReactNode;
  /** Duration of one full loop in seconds. */
  duration?: number;
  pauseOnHover?: boolean;
  className?: string;
  /** Reverse scroll direction. */
  reverse?: boolean;
}

/**
 * Marquee — infinite, seamless scrolling row.
 *
 * Renders children twice and translates the track by -50% over `duration`,
 * producing a gap-less loop. CSS-driven (no JS rAF) for performance and
 * respects prefers-reduced-motion via the global media-query safety net.
 *
 * RTL note: default motion flows right-to-left (content enters from the
 * left edge), matching Persian reading direction.
 */
export function Marquee({
  children,
  duration = 38,
  pauseOnHover = true,
  reverse = false,
  className,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "group relative flex w-full overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className
      )}
      dir="ltr"
    >
      <div
        className={cn(
          "flex shrink-0 items-center",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        style={{
          animation: `marquee-rtl ${duration}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "flex shrink-0 items-center",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        style={{
          animation: `marquee-rtl ${duration}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {children}
      </div>
    </div>
  );
}
