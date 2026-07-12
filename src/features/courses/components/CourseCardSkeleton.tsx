import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CourseCardSkeletonProps {
  className?: string;
}

/**
 * CourseCardSkeleton — loading placeholder matching CourseCard layout.
 * Uses the brand shimmer for premium perceived-loading.
 */
export function CourseCardSkeleton({ className }: CourseCardSkeletonProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-app-border-subtle bg-surface",
        className
      )}
    >
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex items-center justify-between pt-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-24 rounded-pill" />
        </div>
      </div>
    </div>
  );
}
