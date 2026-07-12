import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Users,
  Clock,
  PlayCircle,
  CheckCircle2,
  Globe,
  CalendarClock,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { RatingStars } from "@/components/shared/RatingStars";
import { CoursePrice } from "@/components/shared/CoursePrice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format";
import { siteConfig } from "@/config/site";
import { ldJson, buildCourseLd, buildBreadcrumbLd } from "@/lib/seo";
import { getCourseDetail, courseDetailIds } from "@/features/course-detail/constants";
import { CourseCurriculum } from "@/features/course-detail/components/CourseCurriculum";
import { CheckoutForm } from "@/features/course-detail/components/CheckoutForm";

/** Statically pre-render all known course detail pages. */
export function generateStaticParams() {
  return courseDetailIds.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = getCourseDetail(id);
  if (!course) return {};
  return {
    title: course.title,
    description: course.subtitle,
    openGraph: {
      title: `${course.title} | ${siteConfig.name}`,
      description: course.subtitle,
    },
  };
}

const accentBg: Record<string, string> = {
  violet: "from-blue-600/30 to-blue-400/10",
  pink: "from-amber-400/30 to-yellow-200/10",
  orchid: "from-blue-500/30 to-blue-300/10",
  amber: "from-amber-200/50 to-yellow-100/10",
  blue: "from-blue-200/40 to-blue-100/10",
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = getCourseDetail(id);
  if (!course) notFound();

  return (
    <main className="bg-surface-muted pb-20 pt-[calc(var(--header-h)+1.5rem)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: ldJson(
            buildCourseLd({
              title: course.title,
              description: course.longDescription,
              price: course.price,
              rating: course.rating,
              reviews: course.reviews,
              mentor: course.mentor,
              lessons: course.lessons,
              durationHours: course.durationHours,
              level: course.level,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: ldJson(
            buildBreadcrumbLd([
              { name: "خانه", url: siteConfig.url },
              { name: "دوره‌ها", url: `${siteConfig.url}/#courses` },
              { name: course.title, url: `${siteConfig.url}/courses/${id}` },
            ])
          ),
        }}
      />
      <Container width="page">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-fg-secondary" aria-label="مسیر">
          <Link href="/#courses" className="transition-colors hover:text-accent">
            دوره‌ها
          </Link>
          <ArrowRight className="size-4" />
          <span className="font-medium text-fg-primary">{course.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
          {/* Main column */}
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand">{course.level}</Badge>
                {course.bestseller ? (
                  <Badge variant="success" className="gap-1">
                    <BadgeCheck className="size-3.5" />
                    پرفروش
                  </Badge>
                ) : null}
                <Badge variant="muted" className="gap-1">
                  <Globe className="size-3.5" />
                  {course.language}
                </Badge>
              </div>

              <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-fg-primary sm:text-4xl">
                {course.title}
              </h1>
              <p className="text-lg text-fg-secondary">{course.subtitle}</p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <RatingStars value={course.rating} count={course.reviews} size={16} />
                <span className="flex items-center gap-1.5 text-sm text-fg-secondary">
                  <Users className="size-4 text-accent" />
                  {toPersianDigits(course.students)} دانشجو
                </span>
                <span className="flex items-center gap-1.5 text-sm text-fg-secondary">
                  <Clock className="size-4 text-accent" />
                  {toPersianDigits(course.durationHours)} ساعت
                </span>
                <span className="flex items-center gap-1.5 text-sm text-fg-secondary">
                  <PlayCircle className="size-4 text-accent" />
                  {toPersianDigits(course.lessons)} درس
                </span>
                <span className="flex items-center gap-1.5 text-sm text-fg-secondary">
                  <CalendarClock className="size-4 text-accent" />
                  آخرین بروزرسانی: {course.lastUpdated}
                </span>
              </div>
            </div>

            {/* Cover */}
            <div
              className={cn(
                "relative flex aspect-[21/9] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br",
                accentBg[course.accent]
              )}
            >
              <span className="text-8xl opacity-90">{course.glyph}</span>
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, rgba(37,99,235,0.15) 1px, transparent 0)",
                  backgroundSize: "20px 20px",
                }}
              />
            </div>

            {/* Description */}
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-xl font-bold text-fg-primary">درباره دوره</h2>
              <p className="text-base leading-loose text-fg-secondary">
                {course.longDescription}
              </p>
            </section>

            {/* Outcomes */}
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-xl font-bold text-fg-primary">
                در این دوره چه چیزی یاد می‌گیرید؟
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-start gap-2.5 rounded-xl border border-app-border-subtle bg-surface p-3"
                  >
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-status-success" />
                    <span className="text-sm text-fg-primary">{o.text}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Curriculum */}
            <CourseCurriculum curriculum={course.curriculum} />

            {/* Requirements */}
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-bold text-fg-primary">پیش‌نیازها</h2>
              <ul className="flex flex-col gap-2">
                {course.requirements.map((r) => (
                  <li key={r.id} className="flex items-start gap-2.5 text-sm text-fg-secondary">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" />
                    {r.text}
                  </li>
                ))}
              </ul>
            </section>

            {/* Mentor */}
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-xl font-bold text-fg-primary">مدرس دوره</h2>
              <div className="flex items-start gap-4 rounded-2xl border border-app-border-subtle bg-surface p-5">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-xl font-bold text-white">
                  {course.mentorInitial}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-base font-bold text-fg-primary">
                    {course.mentor}
                  </h3>
                  <p className="text-sm leading-relaxed text-fg-secondary">
                    {course.mentorBio}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Sticky checkout sidebar */}
          <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-fg-primary">ثبت‌نام در دوره</h2>
              <CoursePrice
                amount={course.price}
                originalAmount={course.originalPrice}
                size="lg"
              />
            </div>
            <CheckoutForm course={course} />

            <div className="mt-4 flex items-center justify-center">
              <Button asChild variant="ghost" size="sm">
                <Link href="/#courses">
                  <ArrowRight className="size-4" />
                  بازگشت به دوره‌ها
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
