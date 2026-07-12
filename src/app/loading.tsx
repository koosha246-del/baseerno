import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level skeleton shell — shown during Next.js route navigation.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header skeleton */}
      <div className="sticky top-0 z-header h-[var(--header-h)] border-b border-app-border-subtle bg-surface px-5 lg:px-8">
        <div className="mx-auto flex h-full max-w-page items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="hidden gap-1 md:flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-16 rounded-pill" />
            ))}
          </div>
          <Skeleton className="h-10 w-28 rounded-pill" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="px-5 lg:px-8">
        <div className="mx-auto grid max-w-page items-center gap-12 py-16 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-48 rounded-pill" />
            <Skeleton className="h-12 w-full max-w-md" />
            <Skeleton className="h-12 w-80" />
            <Skeleton className="h-5 w-full max-w-lg" />
            <div className="flex gap-3">
              <Skeleton className="h-14 w-36 rounded-pill" />
              <Skeleton className="h-14 w-32 rounded-pill" />
            </div>
          </div>
          <Skeleton className="aspect-[4/5] w-full rounded-[2.5rem]" />
        </div>
      </div>
    </div>
  );
}
