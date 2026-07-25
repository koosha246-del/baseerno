import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { GradientText } from "@/components/shared/GradientText";
import { PopularCoursesClient } from "@/features/courses/components/PopularCoursesClient";
import { courseCategories, accentClasses } from "@/features/courses/constants";
import { repository } from "@/lib/db/repository";
import { mapDbCourse } from "@/features/courses/courseMapper";
import {
  BookOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "همه دوره‌ها",
  description:
    "کاملترین catalog دوره‌های زبان انگلیسی بصیر نو — گرامر، واژگان، مکالمه، شنیدن، خواندن، نوشتن و آیلتس.",
};

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  let dbCourses: Awaited<ReturnType<typeof repository.listCourses>> = [];
  try {
    dbCourses = await repository.listCourses({
      publishedOnly: true,
      includeMentor: true,
    });
  } catch {
    // DB not reachable — show empty state gracefully.
  }
  const courseList = dbCourses.map(mapDbCourse);

  return (
    <main className="bg-background pb-20 pt-[calc(var(--header-h)+2rem)]">
      <Container width="page">
        {/* Hero */}
        <section className="mb-12 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-pill bg-kid-sky-100 px-4 py-1.5 text-sm font-bold text-kid-sky-700">
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
              <PopularCoursesClient
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
            <span className="mb-3 inline-flex items-center gap-2 rounded-pill bg-white px-4 py-1.5 text-sm font-bold text-kid-sky-700 shadow-sm">
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
