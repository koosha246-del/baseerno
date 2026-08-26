import { Container } from "@/components/shared/Container";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the course detail page.
 * Matches the layout of CourseDetailPage with shimmer placeholders.
 */
export default function CourseDetailLoading() {
  return (
    <main id="main-content" className="bg-surface-muted pb-20 pt-[calc(var(--header-h)+1.5rem)]">
      <Container width="page" className="animate-pulse">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
          {/* Main column */}
          <div className="flex flex-col gap-8">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-pill" />
              <Skeleton className="h-6 w-24 rounded-pill" />
            </div>

            {/* Title & subtitle */}
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-44" />
            </div>

            {/* Cover */}
            <Skeleton className="aspect-[21/9] w-full rounded-2xl" />

            {/* Description */}
            <div className="flex flex-col gap-4">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-5/6" />
            </div>

            {/* Outcomes */}
            <div className="flex flex-col gap-4">
              <Skeleton className="h-7 w-56" />
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            </div>

            {/* Curriculum */}
            <div className="flex flex-col gap-3">
              <Skeleton className="h-7 w-36" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>

            {/* mentor */}
            <div className="flex flex-col gap-4">
              <Skeleton className="h-7 w-28" />
              <div className="flex items-start gap-4">
                <Skeleton className="size-14 shrink-0 rounded-2xl" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="mx-auto h-5 w-32" />
          </aside>
        </div>
      </Container>
    </main>
  );
}
