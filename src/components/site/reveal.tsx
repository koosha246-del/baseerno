"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends React.ComponentProps<"div"> {
  /** تأخیر شروع انیمیشن بر حسب میلی‌ثانیه */
  delay?: number;
  /** جابه‌جایی اولیه بر حسب پیکسل */
  offset?: number;
  /** جهت ورود */
  direction?: "up" | "down" | "none";
}

/**
 * نمایان‌سازی نرم هنگام اسکرول — سبک و سریع.
 * از IntersectionObserver استفاده می‌کند و فقط یک‌بار اجرا می‌شود.
 */
export function Reveal({
  className,
  delay = 0,
  offset = 18,
  direction = "up",
  style,
  ...props
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hiddenTransform =
    direction === "up"
      ? `translateY(${offset}px)`
      : direction === "down"
        ? `translateY(-${offset}px)`
        : "none";

  // Respect prefers-reduced-motion: skip the inline transform entirely so
  // the motion-reduce:transform-none class isn't overridden by inline style.
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-500 ease-out will-change-transform motion-reduce:transition-none motion-reduce:transform-none",
        visible ? "translate-y-0 opacity-100" : "opacity-0",
        className
      )}
      style={{
        transitionDelay: `${delay}ms`,
        ...(visible || prefersReducedMotion ? {} : { transform: hiddenTransform }),
        ...style,
      }}
      {...props}
    />
  );
}
