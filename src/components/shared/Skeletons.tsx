export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-48 rounded-lg bg-surface-subtle" />
        <div className="mt-2 h-4 w-64 rounded bg-surface-subtle/50" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-surface-subtle/50" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="rounded-xl border border-app-border-subtle bg-surface p-5">
        <div className="mb-4 h-6 w-32 rounded bg-surface-subtle" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-surface-subtle/30" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse rounded-xl border border-app-border-subtle bg-surface p-5">
      <div className="mb-4 flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 flex-1 rounded bg-surface-subtle" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-surface-subtle/30" />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-app-border-subtle bg-surface p-5">
      <div className="mb-3 h-6 w-48 rounded bg-surface-subtle" />
      <div className="mb-2 h-4 w-32 rounded bg-surface-subtle/50" />
      <div className="h-2 w-full rounded-full bg-surface-subtle/30" />
    </div>
  );
}

/**
 * CoursesGridSkeleton — loading placeholder for the course listing grid.
 * Renders 6 card skeletons in a 3-column responsive grid.
 */
export function CoursesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-app-border-subtle bg-surface"
        >
          {/* Image placeholder */}
          <div className="aspect-[16/9] bg-surface-subtle" />

          <div className="flex flex-col gap-3 p-5">
            {/* Category badge */}
            <div className="h-5 w-20 rounded-full bg-surface-subtle" />

            {/* Title */}
            <div className="h-5 w-full rounded bg-surface-subtle" />
            <div className="h-5 w-3/4 rounded bg-surface-subtle" />

            {/* Divider */}
            <div className="my-1 h-px bg-surface-subtle/50" />

            {/* Meta info row */}
            <div className="flex items-center gap-4">
              <div className="h-4 w-16 rounded bg-surface-subtle/50" />
              <div className="h-4 w-20 rounded bg-surface-subtle/50" />
            </div>

            {/* Price row */}
            <div className="flex items-center justify-between">
              <div className="h-6 w-24 rounded bg-surface-subtle" />
              <div className="h-9 w-28 rounded-lg bg-surface-subtle" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * PageSkeleton — generic page loading placeholder with heading + content.
 */
export function PageSkeleton() {
  return (
    <div className="container mx-auto animate-pulse px-4 py-8">
      <div className="mb-8 h-10 w-64 rounded-lg bg-surface-subtle" />
      <div className="mb-4 h-4 w-full max-w-2xl rounded bg-surface-subtle/50" />
      <div className="mb-8 h-4 w-3/4 rounded bg-surface-subtle/50" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-surface-subtle/50" />
        ))}
      </div>
    </div>
  );
}
