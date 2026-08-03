"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatCounterProps {
  /** Target value to count up to. */
  value: number;
  /** Optional unit/suffix appended after the number (e.g. "+"). */
  suffix?: string;
  /** Optional prefix prepended before the number. */
  prefix?: string;
  /** Number of decimal places (default 0). */
  decimals?: number;
  /** Animation duration in ms (default 1800). */
  duration?: number;
  className?: string;
  /** When false, renders the final value immediately (no count-up). */
  animate?: boolean;
}

/**
 * StatCounter — counts up to `value` when scrolled into view.
 *
 * - Uses requestAnimationFrame with an easeOutExpo curve for a premium
 *   deceleration feel.
 * - Respects prefers-reduced-motion (jumps to final value instantly).
 * - Renders Persian (Eastern-Arabic) digits.
 */
export function StatCounter({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 1800,
  className,
  animate = true,
}: StatCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion or no-animate → show final value immediately.
    if (reduced || !animate) {
      setDisplay(value);
      return;
    }

    let rafId = 0;
    let started = false;
    const start = performance.now();

    const easeOutExpo = (t: number) =>
      t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      setDisplay(value * eased);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true;
          rafId = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [value, duration, animate, reduced]);

  // Use the Persian decimal separator (٫) instead of the ASCII dot that
  // toFixed produces — decimals should read natively in fa-IR.
  const formatted = toPersianDigits(display.toFixed(decimals)).replace(".", "٫");

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix.replace("%", "٪")}
    </span>
  );
}
