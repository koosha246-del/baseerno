import { Container } from "@/components/shared/Container";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { GradientText } from "@/components/shared/GradientText";
import { repository } from "@/lib/db/repository";
import { courseCategories, accentClasses, courses as staticCourses } from "./constants";
import type { Course, CourseLevel } from "./types";
import { PopularCoursesClient } from "./components/PopularCoursesClient";

/** Valid accent values accepted by the visual layer. */
const ACCENTS = new Set<Course["accent"]>(["violet", "pink", "orchid", "amber", "blue"]);
const VALID_LEVELS = new Set<CourseLevel>(["مقدماتی", "متوسط", "پیشرفته", "حرفه‌ای"]);

/**
 * Map a Prisma Course row (with optional mentor) to the homepage
 * Course shape. Missing / unknown fields fall back to safe defaults
 * so the card UI never crashes on a row that hasn't been enriched.
 */
function mapDbCourse(
  row: Awaited<ReturnType<typeof repository.listCourses>>[number] & {
    mentor?: { name: string } | null;
  },
): Course {
  const accent = ACCENTS.has(row.accent as Course["accent"])
    ? (row.accent as Course["accent"])
    : "blue";
  const level = VALID_LEVELS.has(row.level as CourseLevel)
    ? (row.level as CourseLevel)
    : "مقدماتی";
  const mentorName = row.mentor?.name ?? "مدرس";
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    level,
    mentor: mentorName,
    mentorInitial: mentorName.charAt(0) || "؟",
    rating: row.rating ?? 0,
    reviews: 0, // no review model in schema; shown as 0 until added
    durationHours: row.durationHours,
    lessons: row.lessons,
    price: row.price,
    originalPrice: row.originalPrice,
    bestseller: false, // no flag in schema; reserved for future
    accent,
    glyph: row.glyph,
  };
}

/**
 * Load courses for the homepage.
 * Prefers the database; if Postgres is down / unreachable, falls back
 * to the static catalog so the landing page never hard-crashes.
 */
async function loadHomepageCourses(): Promise<Course[]> {
  try {
    const rows = await repository.listCourses({
      publishedOnly: true,
      includeMentor: true,
      take: 12,
    });
    if (rows.length > 0) {
      return rows.map(mapDbCourse);
    }
    // Empty DB (e.g. not seeded) — still show static demos.
    return staticCourses;
  } catch (err) {
    console.error(
      "[PopularCoursesSection] DB unavailable, using static courses:",
      err instanceof Error ? err.message : err,
    );
    return staticCourses;
  }
}

/**
 * PopularCoursesSection — section #5.
 *
 * Server component. Reads published courses from the database (with
 * static fallback) and hands them off to a client component for
 * filtering / searching.
 */
export async function PopularCoursesSection() {
  const courses = await loadHomepageCourses();
  const categories = courseCategories;

  return (
    <section id="courses" className="section-padding bg-background">
      <SectionHeading
        eyebrow="درس‌های انگلیسی"
        title={
          <>
            درس‌هایی <GradientText>ساده</GradientText> برای دانش‌آموز
          </>
        }
        description="هر درس کوتاه، واضح و قدم‌به‌قدم است تا گیج نشوی و جلو بروی."
      />

      <Container width="page" className="mt-10">
        <PopularCoursesClient
          courses={courses}
          categories={categories}
          accentClasses={accentClasses}
        />
        <noscript>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <article key={c.id}>{c.title}</article>
            ))}
          </div>
        </noscript>
        <ScrollReveal className="hidden">{null}</ScrollReveal>
      </Container>
    </section>
  );
}
