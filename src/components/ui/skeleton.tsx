import { cn } from "@/lib/utils";

/**
 * Skeleton — loading placeholder with brand shimmer.
 * Uses the .skeleton-shimmer utility for a premium loading state.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
