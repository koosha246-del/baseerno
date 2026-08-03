import { CoursesGridSkeleton } from "@/components/shared/Skeletons";

/**
 * Library page skeleton — mirrors the book grid layout (3 cols on lg+).
 * Uses the same CoursesGridSkeleton the /courses page uses since the
 * visual rhythm (3-up responsive grid of cards) is identical.
 */
export default function Loading() {
  return <CoursesGridSkeleton />;
}
