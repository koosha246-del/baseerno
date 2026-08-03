import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
  accent?: "brand" | "navy" | "green" | "blue" | "amber";
}

/**
 * Accent only on the icon chip + left border — card body stays neutral
 * so a grid of stats doesn't look like a wall of solid color blocks.
 */
const accentBorder: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "border-s-accent",
  navy: "border-s-slate-400",
  green: "border-s-emerald-500",
  blue: "border-s-blue-500",
  amber: "border-s-amber-500",
};

const accentIcon: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "bg-accent/15 text-accent",
  navy: "bg-slate-500/20 text-slate-200",
  green: "bg-emerald-500/15 text-emerald-400",
  blue: "bg-blue-500/15 text-blue-400",
  amber: "bg-amber-500/15 text-amber-400",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
  accent = "brand",
}: StatCardProps) {
  return (
    <div
      aria-label={`${label}: ${value}`}
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-slate-800/50 p-5",
        "border-s-4 transition-colors hover:bg-slate-800/80",
        accentBorder[accent],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-medium text-slate-400">{label}</span>
          <span className="truncate text-2xl font-extrabold text-white">{value}</span>
          {trend ? (
            <span
              className={cn(
                "mt-1 text-xs font-semibold",
                trend.positive ? "text-emerald-400" : "text-red-400",
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          ) : null}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            accentIcon[accent],
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
