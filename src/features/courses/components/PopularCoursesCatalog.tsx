"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PopularCoursesClient } from "./PopularCoursesClient";
import type { Course, CourseCategory } from "../types";

interface Props {
  courses: Course[];
  categories: CourseCategory[];
  accentClasses: Record<Course["accent"], string>;
}

/**
 * Renders the course grid with URL support for `?q=...` (the SearchAction
 * JSON-LD deep-links here: /courses?q={search_term_string}).
 *
 * The `useSearchParams` hook lives in the tiny `SearchQuerySeed` child,
 * isolated in its own Suspense boundary that renders nothing. The grid
 * itself stays OUTSIDE that boundary, so the course content remains in
 * the statically-rendered HTML (SEO) and no page-level Suspense is
 * required from callers.
 */
export function PopularCoursesCatalog({ courses, categories, accentClasses }: Props) {
  const [urlQuery, setUrlQuery] = useState("");

  return (
    <>
      <PopularCoursesClient
        courses={courses}
        categories={categories}
        accentClasses={accentClasses}
        initialQuery={urlQuery}
      />
      <Suspense fallback={null}>
        <SearchQuerySeed onQuery={setUrlQuery} />
      </Suspense>
    </>
  );
}

function SearchQuerySeed({ onQuery }: { onQuery: (q: string) => void }) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  useEffect(() => {
    onQuery(q);
  }, [q, onQuery]);
  return null;
}
