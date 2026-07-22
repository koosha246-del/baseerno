import { cn } from "@/lib/utils";

export type StatusBadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "brand";

const variantClasses: Record<StatusBadgeVariant, string> = {
  success: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20",
  warning: "bg-amber-500/15 text-amber-400 ring-amber-500/20",
  danger: "bg-red-500/15 text-red-400 ring-red-500/20",
  info: "bg-blue-500/15 text-blue-400 ring-blue-500/20",
  neutral: "bg-slate-500/15 text-slate-300 ring-slate-500/20",
  brand: "bg-accent/15 text-accent ring-accent/20",
};

/** Map common domain statuses to badge variants. */
export function statusVariantFromValue(
  value: string,
): StatusBadgeVariant {
  const v = value.toUpperCase();
  if (["PAID", "COMPLETED", "ACTIVE", "PUBLISHED", "SUCCESS", "READ"].includes(v)) {
    return "success";
  }
  if (["PENDING", "DRAFT", "UNREAD", "WARNING"].includes(v)) {
    return "warning";
  }
  if (["FAILED", "DROPPED", "CANCELLED", "DANGER", "ERROR"].includes(v)) {
    return "danger";
  }
  if (["STUDENT", "INFO", "TEACHER"].includes(v)) {
    return "info";
  }
  if (["ADMIN"].includes(v)) {
    return "warning";
  }
  return "neutral";
}

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: StatusBadgeVariant;
  /** Optional domain status string (PAID, DRAFT, …) — sets variant when provided. */
  status?: string;
  className?: string;
}

/**
 * Shared pill badge for payment / enrollment / publish / role states.
 * Soft tint background + ring — readable on dark dashboard surfaces.
 */
export function StatusBadge({
  children,
  variant,
  status,
  className,
}: StatusBadgeProps) {
  const resolved =
    variant ?? (status ? statusVariantFromValue(status) : "neutral");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ring-1 ring-inset",
        variantClasses[resolved],
        className,
      )}
    >
      {children}
    </span>
  );
}
