import { Container } from "@/components/shared/Container";
import { CoursesGridSkeleton } from "@/components/shared/Skeletons";

export default function CoursesLoading() {
  return (
    <section className="section-padding bg-background">
      <Container width="page" className="animate-pulse">
        {/* Title skeleton */}
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <div className="h-6 w-28 rounded-full bg-surface-subtle" />
          <div className="h-10 w-3/4 rounded-lg bg-surface-subtle" />
          <div className="h-5 w-1/2 rounded bg-surface-subtle/50" />
        </div>

        <div className="mt-10">
          <CoursesGridSkeleton />
        </div>
      </Container>
    </section>
  );
}
