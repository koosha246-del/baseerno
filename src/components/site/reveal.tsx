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
 *
 * الگوی «فول‌بک امن»:
 *  - محتوا به‌صورت پیش‌فرض نمایان رندر می‌شود (SSR و hydration هر دو
 *    markup یکسان تولید می‌کنند → هیچ اختلافی و هیچ Reveal گیرافتاده‌ای
 *    باقی نمی‌ماند).
 *  - فقط بعد از mount، اگر مرورگر پشتیبانی کند، المان برای یک فریم مخفی
 *    و سپس با ورود به viewport نمایان می‌شود.
 *  - اگر IntersectionObserver غیرفعال/خطا بدهد یا hydration ناقص بماند،
 *    هیچ‌وقت محتوای مخفی نمی‌ماند — بدترین حالت، نمایش بدون انیمیشن است.
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
  const [armed, setArmed] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof IntersectionObserver === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return; // بدون انیمیشن — محتوا از ابتدا نمایان است
    }

    let observer: IntersectionObserver | null = null;
    let revealTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      // فول‌بک زمانی: حتی اگر observer هرگز فایر نشود، بعد از ۲.۵ ثانیه
      // پس از ورود به viewport (یا به‌طور مطلق) نمایان می‌شود.
      const r = el.getBoundingClientRect();
      const alreadyInView = r.top < window.innerHeight && r.bottom > 0;
      if (alreadyInView) {
        revealTimer = setTimeout(() => setVisible(true), delay + 100);
      }

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setVisible(true);
              if (revealTimer) clearTimeout(revealTimer);
              observer?.disconnect();
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      observer.observe(el);
    } catch {
      setVisible(true); // هر خطایی → نمایش بدون انیمیشن
    }

    return () => {
      observer?.disconnect();
      if (revealTimer) clearTimeout(revealTimer);
    };
  }, [delay]);

  // بعد از mount، برای شروع انیمیشن «مسلح» می‌شویم؛ تا قبل از آن محتوا
  // نمایان است (SSR-safe) و صفحه هرگز خالی دیده نمی‌شود.
  React.useEffect(() => {
    setArmed(true);
  }, []);

  const hiddenTransform =
    direction === "up"
      ? `translateY(${offset}px)`
      : direction === "down"
        ? `translateY(-${offset}px)`
        : "none";

  const hidden = armed && !visible;

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-500 ease-out will-change-transform motion-reduce:transition-none motion-reduce:transform-none",
        hidden ? "opacity-0" : "translate-y-0 opacity-100",
        className
      )}
      style={{
        transitionDelay: `${delay}ms`,
        ...(hidden ? { transform: hiddenTransform } : {}),
        ...style,
      }}
      {...props}
    />
  );
}
