"use client";

import { cn } from "@/lib/utils";
import { courseCategories } from "../constants";

interface CourseFiltersProps {
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * CourseFilters — category tab strip above the course grid.
 * Accessible tablist pattern; controlled by the parent section.
 */
export function CourseFilters({ active, onChange, className }: CourseFiltersProps) {
  return (
    <div
      role="tablist"
      aria-label="فیلتر دوره‌ها بر اساس دسته‌بندی"
      className={cn(
        "flex flex-wrap items-center justify-center gap-2",
        className
      )}
    >
      {courseCategories.map((cat) => {
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(cat.id)}
            className={cn(
              "rounded-pill px-4 py-2 text-sm font-semibold transition-all duration-base ease-luxury focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              isActive
                ? "bg-brand-gradient text-white shadow-glow"
                : "bg-surface-subtle text-fg-secondary hover:bg-accent-soft hover:text-accent"
            )}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
