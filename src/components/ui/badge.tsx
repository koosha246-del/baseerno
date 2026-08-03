import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge — compact status / category pill.
 * Brand variant uses the gradient surface; soft variants tint by hue.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-accent-soft text-accent",
        brand: "bg-accent text-white shadow-sm",
        outline: "border border-app-border text-fg-secondary bg-surface",
        muted: "bg-surface-subtle text-fg-secondary",
        success: "bg-status-success/10 text-status-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
