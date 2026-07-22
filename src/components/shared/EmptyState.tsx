import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Lucide icon component — defaults to Inbox. */
  icon?: LucideIcon;
  /** Optional CTA (button / link). */
  action?: React.ReactNode;
  className?: string;
  /** Visual density. */
  size?: "sm" | "md" | "lg";
}

/**
 * Illustrated empty state for dashboard lists/tables.
 * Soft gradient orb + icon so empty pages feel intentional, not broken.
 */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const pad =
    size === "sm" ? "p-8" : size === "lg" ? "p-16" : "p-12";
  const iconBox =
    size === "sm" ? "size-14" : size === "lg" ? "size-20" : "size-16";
  const iconSize =
    size === "sm" ? "size-7" : size === "lg" ? "size-10" : "size-8";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-slate-800/40 text-center",
        pad,
        className,
      )}
    >
      <div className="relative mb-5">
        {/* Soft illustration orbs */}
        <div
          aria-hidden
          className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-accent/25 via-blue-500/10 to-transparent blur-xl"
        />
        <div
          aria-hidden
          className="absolute -left-3 -top-2 size-10 rounded-full bg-amber-400/10 blur-md"
        />
        <div
          className={cn(
            "relative flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 shadow-lg shadow-black/20",
            iconBox,
          )}
        >
          <Icon className={cn("text-slate-400", iconSize)} strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="text-base font-bold text-white sm:text-lg">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
