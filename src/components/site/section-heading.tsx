import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** برچسب کوچک بالای عنوان */
  kicker: string;
  /** عنوان اصلی */
  title: React.ReactNode;
  /** توضیح اختیاری زیر عنوان */
  description?: string;
  /** ترازبندی */
  align?: "start" | "center";
  /** تم رنگی: روشن برای پس‌زمینه‌های تیره */
  tone?: "dark" | "light";
  /** رنگ چیپ کیکر */
  kickerAccent?: "brand" | "sun" | "tang" | "leaf" | "navy";
  className?: string;
}

const kickerTones: Record<NonNullable<SectionHeadingProps["kickerAccent"]>, string> = {
  brand: "bg-brand/10 text-brand",
  sun: "bg-sun/20 text-[#9a6a00]",
  tang: "bg-tang/10 text-tang",
  leaf: "bg-leaf/10 text-leaf",
  navy: "bg-navy/10 text-navy",
};

/**
 * الگوی مشترک عنوان بخش‌ها — چیپ کیکر + عنوان بزرگ + توضیح
 */
export function SectionHeading({
  kicker,
  title,
  description,
  align = "start",
  tone = "dark",
  kickerAccent = "brand",
  className,
}: SectionHeadingProps) {
  const isLight = tone === "light";

  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold",
          isLight
            ? "bg-white/10 text-white"
            : kickerTones[kickerAccent]
        )}
      >
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            isLight ? "bg-sun" : "bg-current"
          )}
        />
        {kicker}
      </span>

      <h2
        className={cn(
          "mt-5 text-3xl font-extrabold leading-[1.3] tracking-tight md:text-[2.6rem] md:leading-[1.25]",
          isLight ? "text-white" : "text-navy"
        )}
      >
        {title}
      </h2>

      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-8 md:text-lg md:leading-9",
            isLight ? "text-blue-100/80" : "text-ink-soft"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
