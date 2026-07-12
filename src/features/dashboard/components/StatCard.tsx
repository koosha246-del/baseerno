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

const accentStyles = {
  brand: "bg-accent",
  navy: "bg-slate-700",
  green: "bg-emerald-600",
  blue: "bg-blue-600",
  amber: "bg-amber-500",
};

export function StatCard({ label, value, icon: Icon, trend, className, accent = "brand" }: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 p-5",
        accentStyles[accent],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-white/80">{label}</span>
          <span className="text-2xl font-extrabold text-white">{value}</span>
          {trend ? (
            <span
              className={cn(
                "mt-1 text-xs font-semibold",
                trend.positive ? "text-green-200" : "text-red-200"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          ) : null}
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-white/20">
          <Icon className="size-5 text-white" />
        </div>
      </div>
    </div>
  );
}
