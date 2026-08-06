import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { GradientText } from "@/components/shared/GradientText";
import { PopularCoursesCatalog } from "@/features/courses/components/PopularCoursesCatalog";
import { courseCategories, accentClasses } from "@/features/courses/constants";
import { mapDbCourse } from "@/features/courses/courseMapper";
import { buildPageMetadata } from "@/lib/seo";
import {
  BookOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = buildPageMetadata({
  title: "همه دوره‌ها",
  description:
    "کاملترین catalog دوره‌های زبان انگلیسی بصیر نو — گرامر، واژگان، مکالمه، شنیدن، خواندن، نوشتن و آیلتس.",
  path: "/courses",
});

/**
 * ISR: revalidate at most every 5 minutes. Course rows come from the
 * Redis data cache (`getOrSet`, key `courses:published`, TTL 300s,
 * tagged `courses`) with an `unstable_cache` fallback, and are busted
 * immediately on mutations via `invalidateCache`.
 */
export const revalidate = 300;

export default async function CoursesPage() {
  // The query module is imported dynamically INSIDE the try/catch so a
  // module-eval throw (e.g. missing DATABASE_URL in prisma-client.ts)
  // can't blank this page — same resilience as the homepage.
  let courseList: ReturnType<typeof mapDbCourse>[] = [];
  try {
    const { getCachedPublishedCourses } = await import("@/lib/db/queries");
    const dbCourses = await getCachedPublishedCourses();
    courseList = dbCourses.map(mapDbCourse);
  } catch {
    // DB not reachable — show empty state gracefully.
  }

  return (
    <main className="bg-background pb-20 pt-[calc(var(--header-h)+2rem)]">
      <Container width="page">
        {/* Hero */}
        <section className="mb-12 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-pill bg-kid-sky-100 px-4 py-1.5 text-sm font-bold text-kid-sky-600">
            <GraduationCap className="size-4" />
            همه دوره‌ها
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg-primary sm:text-5xl">
            هر مهارتی که نیاز داری، <GradientText>اینجاست</GradientText>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-loose text-fg-secondary">
            از گرامر پایه تا آیلتس پیشرفته. هر دوره توسط متخصصان طراحی شده
            و با کتاب‌های استاندارد Cambridge تدریس می‌شود.
          </p>
        </section>

        {/* Courses Grid */}
        <section>
          <ScrollReveal>
            <SectionHeading
              eyebrow="دوره‌های زبان انگلیسی"
              title={
                <>
                  <GradientText>همه دوره‌ها</GradientText> در یک نگاه
                </>
              }
              description="گرامر، واژگان، شنیدن، خواندن، نوشتن و آیلتس — با فیلتر و جستجو سریع پیدا کن."
            />
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="mt-10">
              <PopularCoursesCatalog
                courses={courseList}
                categories={courseCategories}
                accentClasses={accentClasses}
              />
            </div>
          </ScrollReveal>
        </section>

        {/* CTA */}
        <section className="mt-16 rounded-3xl bg-kid-sky-50 p-8 text-center sm:p-12">
          <ScrollReveal>
            <span className="mb-3 inline-flex items-center gap-2 rounded-pill bg-white px-4 py-1.5 text-sm font-bold text-kid-sky-600 shadow-sm dark:bg-surface">
              <Sparkles className="size-4" />
              اولین درس رایگان
            </span>
            <h2 className="font-display text-2xl font-extrabold text-fg-primary sm:text-3xl">
              هنوز مطمئن نیستی؟
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-loose text-fg-secondary">
              اولین درس هر دوره رایگانه. ثبت‌نام کن، امتحان کن، بعد تصمیم بگیر.
            </p>
            <div className="mt-6">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-pill bg-brand-gradient px-8 py-3 text-sm font-bold text-white shadow-glow transition-all hover:scale-105 hover:shadow-lg"
              >
                <BookOpen className="size-4" />
                ثبت‌نام رایگان
              </Link>
            </div>
          </ScrollReveal>
        </section>
      </Container>
    </main>
  );
}
