"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "./CourseCard";
import { CourseFilters } from "./CourseFilters";
import { CourseCardSkeleton } from "./CourseCardSkeleton";
import type { Course, CourseCategory } from "../types";

interface Props {
  courses: Course[];
  categories: CourseCategory[];
  accentClasses: Record<Course["accent"], string>;
}

/**
 * Client-side filter / search UI for the popular-courses grid.
 *
 * Receives the course list from the server component (which fetches
 * from Prisma) and lets the user narrow it down without a round trip.
 * The grid re-keys on filter change so the entrance stagger replays.
 */
export function PopularCoursesClient({ courses, categories, accentClasses }: Props) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [loading] = useState(false);

  const filtered = useMemo(() => {
    let result =
      active === "all" ? courses : courses.filter((c) => c.category === active);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.mentor.toLowerCase().includes(q),
      );
    }
    return result;
  }, [active, query, courses]);

  return (
    <>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CourseFilters
          active={active}
          onChange={setActive}
          categories={categories}
        />
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی درس..."
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
        <div
          key={active}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} accentClasses={accentClasses} />
          ))}
        </div>
      )}

      <div className="mt-12 flex justify-center">
        <Button asChild variant="outline" size="lg" className="group/btn">
          <a href="#courses">
            همه درس‌ها
            <ArrowLeft className="size-4 transition-transform duration-base ease-luxury group-hover/btn:-translate-x-1" />
          </a>
        </Button>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-app-border bg-surface-subtle py-16 text-center">
      <span className="text-4xl">📭</span>
      <p className="font-bold text-fg-primary">درسی در این بخش پیدا نشد</p>
      <p className="text-sm text-fg-secondary">به‌زودی درس‌های جدید می‌آیند.</p>
    </div>
  );
}
