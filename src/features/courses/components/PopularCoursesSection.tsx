"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { GradientText } from "@/components/shared/GradientText";
import { Button } from "@/components/ui/button";
import { CourseCard } from "./CourseCard";
import { CourseFilters } from "./CourseFilters";
import { CourseCardSkeleton } from "./CourseCardSkeleton";
import { courses } from "../constants";

/**
 * PopularCoursesSection — section #5.
 *
 * Filterable course grid. Simulated async load → skeleton state → cards.
 * Default category "all" shows every course.
 */
export function PopularCoursesSection() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [loading] = useState(false);

  const filtered = useMemo(() => {
    let result = active === "all" ? courses : courses.filter((c) => c.category === active);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.mentor.toLowerCase().includes(q)
      );
    }
    return result;
  }, [active, query]);

  return (
    <section id="courses" className="section-padding bg-background">
      <SectionHeading
        eyebrow="دوره‌های محبوب"
        title={
          <>
            دوره‌هایی که مسیر حرفه‌ای شدن را <GradientText>هموار</GradientText> می‌کنند
          </>
        }
        description="هر دوره با ساختار آموزشی دقیق، تمرین عملی و پشتیبانی مستمر طراحی شده تا نتیجه واقعی بگیری."
      />

      <Container width="page" className="mt-10">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CourseFilters active={active} onChange={setActive} />
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی دوره..."
              className="w-full rounded-xl border border-app-border bg-surface py-2.5 pr-10 pl-4 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollReveal
            stagger
            staggerAmount={0.1}
            key={active} // re-trigger reveal on filter change
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </ScrollReveal>
        )}

        <div className="mt-12 flex justify-center">
          <Button asChild variant="outline" size="lg" className="group/btn">
            <a href="#courses">
              مشاهده همه دوره‌ها
              <ArrowLeft className="size-4 transition-transform duration-base ease-luxury group-hover/btn:-translate-x-1" />
            </a>
          </Button>
        </div>
      </Container>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-app-border bg-surface-subtle py-16 text-center">
      <span className="text-4xl">📭</span>
      <p className="font-bold text-fg-primary">دوره‌ای در این دسته یافت نشد</p>
      <p className="text-sm text-fg-secondary">به‌زودی دوره‌های جدید اضافه می‌شوند.</p>
    </div>
  );
}
