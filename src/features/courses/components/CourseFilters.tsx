"use client";

import { cn } from "@/lib/utils";
import { courseCategories } from "../constants";
import type { CourseCategory } from "../types";

interface CourseFiltersProps {
  active: string;
  onChange: (id: string) => void;
  className?: string;
  /**
   * Optional override for the category list. Defaults to the static
   * `courseCategories` from `constants.ts`. The server component
   * passes its filtered list through here.
   */
  categories?: CourseCategory[];
}

/**
 * CourseFilters — category tab strip above the course grid.
 * Accessible tablist pattern; controlled by the parent section.
 */
export function CourseFilters({
  active,
  onChange,
  className,
  categories,
}: CourseFiltersProps) {
  const list = categories ?? courseCategories;
  return (
    <div
      role="tablist"
      aria-label="فیلتر درس‌ها"
      className={cn(
        "flex flex-wrap items-center justify-center gap-2",
        className,
      )}
    >
      {list.map((cat) => {
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={isActive}
            aria-controls="courses-tabpanel"
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(cat.id)}
            className={cn(
              "rounded-pill px-4 py-2 text-sm font-semibold transition-all duration-base ease-luxury focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              isActive
                ? "bg-brand-gradient text-white shadow-glow"
                : "bg-surface-subtle text-fg-secondary hover:bg-accent-soft hover:text-accent",
            )}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
