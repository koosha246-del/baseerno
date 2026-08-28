import { cn } from "@/lib/utils";

interface LogoProps {
  /** تم رنگی */
  tone?: "dark" | "light";
  className?: string;
}

/**
 * نشان برند بصیر — حباب گفت‌وگو با حرف «ب»
 */
export function Logo({ tone = "dark", className }: LogoProps) {
  const isLight = tone === "light";

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      {/* نشان حباب گفت‌وگو */}
      <span className="relative inline-flex size-11 shrink-0">
        <svg
          viewBox="0 0 44 44"
          className="size-full"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="1" y="1" width="42" height="36" rx="12" className="fill-brand" />
          <path d="M12 35 L12 43 L22 35 Z" className="fill-brand" />
        </svg>
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pt-1 text-xl font-extrabold text-white"
        >
          ب
        </span>
      </span>

      {/* نام برند */}
      <span className="flex flex-col leading-tight">
        <span
          className={cn(
            "text-[11px] font-medium tracking-wide",
            isLight ? "text-blue-200/80" : "text-ink-soft"
          )}
        >
          آموزشگاه زبان
        </span>
        <span
          className={cn(
            "text-xl font-black tracking-tight",
            isLight ? "text-white" : "text-navy"
          )}
        >
          بصیر
        </span>
      </span>
    </span>
  );
}
