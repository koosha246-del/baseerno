import { cn } from "@/lib/utils";
import { formatToman } from "@/lib/format";

interface CoursePriceProps {
  /** Price in Toman. Pass null/undefined for "free". */
  amount: number | null;
  /** Original price for strike-through discount display. */
  originalAmount?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
} as const;

/**
 * CoursePrice — Toman price formatter with discount support.
 * Renders Persian digits + "تومان" suffix; "رایگان" when amount is null.
 */
export function CoursePrice({
  amount,
  originalAmount,
  className,
  size = "md",
}: CoursePriceProps) {
  const hasDiscount =
    originalAmount != null && amount != null && originalAmount > amount;

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      {hasDiscount && originalAmount ? (
        <span className="text-xs font-medium text-fg-muted line-through">
          {formatToman(originalAmount)}
        </span>
      ) : null}
      {amount == null || amount === 0 ? (
        <span className={cn("font-extrabold text-status-success", sizeMap[size])}>
          رایگان
        </span>
      ) : (
        <span className={cn("font-extrabold text-fg-primary", sizeMap[size])}>
          {formatToman(amount)}
        </span>
      )}
    </div>
  );
}
