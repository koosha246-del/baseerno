import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format";

interface RatingStarsProps {
  /** Rating value 0–5. */
  value: number;
  /** Optional count of reviews shown after the stars. */
  count?: number;
  size?: number;
  className?: string;
  /** Show numeric value next to stars. */
  showValue?: boolean;
}

/**
 * RatingStars — RTL-aware star rating display.
 * Supports half-star rendering via clipped overlay.
 */
export function RatingStars({
  value,
  count,
  size = 16,
  className,
  showValue = true,
}: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(5, value));

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="img"
      aria-label={`امتیاز ${toPersianDigits(clamped.toFixed(1))} از ۵`}
      dir="ltr"
    >
      <div className="relative inline-flex" style={{ height: size }}>
        {/* Empty layer */}
        <div className="flex" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              width={size}
              height={size}
              className="text-surface-subtle"
              fill="currentColor"
              strokeWidth={0}
            />
          ))}
        </div>
        {/* Filled layer — clipped to the rating fraction */}
        <div
          className="absolute inset-0 flex overflow-hidden"
          style={{ width: `${(clamped / 5) * 100}%` }}
          aria-hidden
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              width={size}
              height={size}
              className="shrink-0 text-amber-400"
              fill="currentColor"
              strokeWidth={0}
            />
          ))}
        </div>
      </div>
      {showValue ? (
        <span className="text-sm font-bold text-fg-primary">
          {toPersianDigits(clamped.toFixed(1))}
        </span>
      ) : null}
      {count != null ? (
        <span className="text-xs text-fg-secondary">
          ({toPersianDigits(count)})
        </span>
      ) : null}
    </div>
  );
}
