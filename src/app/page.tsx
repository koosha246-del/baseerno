import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/features/header/components/SiteHeader";
import { SiteFooter } from "@/features/footer/components/SiteFooter";
import { HeroContent } from "@/features/hero/components/HeroContent";
import { HeroShowcase } from "@/features/hero/components/HeroShowcase";
import { CapabilitiesSection } from "@/features/capabilities/CapabilitiesSection";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { GradientText } from "@/components/shared/GradientText";
import { PopularCoursesClient } from "@/features/courses/components/PopularCoursesClient";
import { courseCategories, accentClasses } from "@/features/courses/constants";
import { libraryBooks, formatToman, getBookCover } from "@/lib/library";
import { siteConfig } from "@/config/site";
import { HOMEPAGE_COURSES_TAKE } from "@/lib/cache-tags";
import { mapDbCourse } from "@/features/courses/courseMapper";
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Users,
  Award,
  Headphones,
  PenTool,
  BookText,
  ArrowLeft,
  BookMarked,
} from "lucide-react";

/**
 * Homepage layout:
 *
 *   ┌─────────────────────────────────────┐
 *   │  SiteHeader (sticky)                 │
 *   ├─────────────────────────────────────┤
 *   │  Hero — product window (showcase)    │
 *   │  Capabilities — real feature grid    │
 *   │  Welcome / About بصیر نو            │
 *   │  Books (Setayesh catalog)              │
 *   │  Courses (English skills)            │
 *   │  Why بصیر نو (4 reasons)             │
 *   │  CTA / ثبت‌نام                      │
 *   └─────────────────────────────────────┘
 *   SiteFooter
 *
 * Each content section uses `ScrollReveal` so it animates in as the
 * user scrolls past — feels like "one by one" without being intrusive.
 *
 * ISR: the page revalidates at most every 5 minutes. The course list is
 * served from the Redis data cache (`getOrSet`, key `courses:published:8`,
 * TTL 300s, tagged `courses`) with an `unstable_cache` fallback, and is
 * invalidated immediately on mutations via `invalidateCache`, so requests
 * rarely hit the DB for the static shell.
 */
export const revalidate = 300;

export default async function HomePage() {
  // Pull published courses from the data cache; fall back to an empty
  // list if the DB is unreachable. The section itself is ALWAYS rendered
  // (with an empty state) so the #courses header anchor keeps a scroll target.
  //
  // NOTE: the query module is imported DYNAMICALLY inside the try/catch.
  // prisma-client.ts throws at module-evaluation time when DATABASE_URL is
  // missing ("... at eval"), and a static import would propagate that throw
  // before this page could handle it — blank/white screen on every request.
  // A dynamic import turns that module-load failure into a rejected promise
  // that we catch here, so the homepage always renders.
  let courseList: ReturnType<typeof mapDbCourse>[] = [];
  try {
    const { getCachedPublishedCourses } = await import("@/lib/db/queries");
    const dbCourses = await getCachedPublishedCourses(HOMEPAGE_COURSES_TAKE);
    courseList = dbCourses.map(mapDbCourse);
  } catch {
    // DB not reachable — grid shows the empty state.
  }

  return (
    <>
      <SiteHeader />
      <main id="home">
        {/* ─── 1. HERO — the product, above the fold ─────────────── */}
        <section
          className="relative overflow-hidden bg-background pt-[calc(var(--header-h)+2rem)] pb-16 lg:pt-[calc(var(--header-h)+3.5rem)] lg:pb-24"
        >
          {/* Aurora backdrop */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-aurora opacity-70" />
          <Container width="page" className="relative">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <HeroContent />
              <HeroShowcase />
            </div>
          </Container>
        </section>

        {/* ─── 2. CAPABILITIES — what the platform actually does ── */}
        <CapabilitiesSection />

        {/* ─── 3. WELCOME — what is بصیر نو? ────────────────────── */}
        <WelcomeSection />

        {/* ─── 4. BOOKS — Setayesh catalog ──────────────────────────── */}
        <BooksSection />

        {/* ─── 5. COURSES — English skills, DB-driven ────────────── */}
        {/* Always rendered (even with an empty DB) so the #courses anchor
            in the header nav always has a scroll target. The client grid
            shows an empty state when there are no published courses. */}
        <CoursesSection courses={courseList} />

        {/* ─── 6. WHY US — 4 reasons بصیر نو is different ────────── */}
        <WhyUsSection />

        {/* ─── 7. CTA — start your first lesson ──────────────────── */}
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  3. WELCOME                                                          */
/* ──────────────────────────────────────────────────────────────────── */

function WelcomeSection() {
  return (
    <section
      id="welcome"
      className="bg-background pb-20 pt-24 lg:pb-28 lg:pt-32"
    >
      <Container width="page">
        <ScrollReveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-pill bg-kid-sky-100 px-4 py-1.5 text-sm font-bold text-kid-sky-600 dark:bg-kid-sky-500/15 dark:text-kid-sky-300">
              <Sparkles className="size-4" />
              خوش اومدی به {siteConfig.name}
            </span>
            <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-fg-primary sm:text-5xl">
              ما <GradientText>انگلیسی</GradientText> رو ساده یاد می‌دیم
            </h2>
            <p className="mt-5 text-base leading-loose text-fg-secondary sm:text-lg">
              {siteConfig.name} یک آکادمی زبان انگلیسیه. کار ما فقط یه چیزه:
              کمکت کنیم انگلیسی رو قدم به قدم، با کتاب‌های استاندارد و روش
              درست یاد بگیری. بدون حاشیه، بدون ادعای بزرگ — فقط یادگیری.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
            <Stat icon={Users} value="+۱۲٬۰۰۰" label="دانش‌آموز فعال" tone="sky" />
            <Stat icon={BookOpen} value="۵+" label="کتاب استاندارد بین‌المللی" tone="coral" />
            <Stat icon={Award} value="۹۶٪" label="رضایت والدین" tone="mint" />
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  tone: "sky" | "coral" | "mint";
}) {
  const palette = {
    sky: "bg-kid-sky-50 text-kid-sky-600 dark:bg-kid-sky-500/15 dark:text-kid-sky-300",
    coral: "bg-kid-coral-50 text-kid-coral-600 dark:bg-kid-coral-500/15 dark:text-kid-coral-300",
    mint: "bg-kid-mint-50 text-kid-mint-600 dark:bg-kid-mint-500/15 dark:text-kid-mint-300",
  };
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-app-border-subtle bg-surface p-5 text-center">
      <span className={`flex size-12 items-center justify-center rounded-xl ${palette[tone]}`}>
        <Icon className="size-6" />
      </span>
      <p className="font-display text-2xl font-extrabold text-fg-primary">
        {value}
      </p>
      <p className="text-xs text-fg-secondary">{label}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  4. BOOKS                                                            */
/* ──────────────────────────────────────────────────────────────────── */

function BooksSection() {
  return (
    <section
      id="books"
      className="bg-surface-muted py-20 lg:py-28"
    >
      <Container width="page">
        <ScrollReveal>
          <SectionHeading
            eyebrow="کتاب‌های آموزشی"
            title={
              <>
                با <GradientText>کتاب‌های استاندارد</GradientText> دنیا یاد بگیر
              </>
            }
            description="مجموعه Milestones، Genius، Ace it!‌، Smart English و Smart plus از انتشارات Setayesh — کتاب‌های استاندارد آموزش زبان انگلیسی."
          />
        </ScrollReveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {libraryBooks.slice(0, 5).map((book, i) => (
            <ScrollReveal key={book.id} delay={i * 0.05}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-app-border-subtle bg-surface shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-kid-sky-100 to-kid-mint-100 dark:from-kid-sky-500/20 dark:to-kid-mint-500/20">
                  <Image
                    src={getBookCover(book)}
                    alt={book.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-bold text-fg-primary shadow dark:bg-surface dark:text-fg-primary">
                    {book.level}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h3 className="font-display text-base font-bold text-fg-primary">
                    {book.title}
                  </h3>
                  {book.subtitle && (
                    <p className="text-xs text-fg-secondary">{book.subtitle}</p>
                  )}
                  <p className="text-xs text-fg-muted">نویسنده: {book.author}</p>
                  {book.pages && (
                    <p className="text-[0.7rem] text-fg-muted">{book.pages} صفحه</p>
                  )}
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-fg-secondary">
                    {book.description}
                  </p>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <div>
                      <p className="text-[0.7rem] text-fg-muted">قیمت</p>
                      <p className="font-display text-base font-extrabold text-fg-primary">
                        {formatToman(book.price)}
                      </p>
                    </div>
                    <Button asChild variant="brand" size="sm">
                      <Link href="/library">
                        <BookMarked className="size-3.5" />
                        مشاهده
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg" className="group/btn">
            <Link href="/library">
              دیدن همه کتاب‌ها
              <ArrowLeft className="size-4 transition-transform group-hover/btn:-translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  5. COURSES                                                          */
/* ──────────────────────────────────────────────────────────────────── */

function CoursesSection({
  courses,
}: {
  courses: ReturnType<typeof mapDbCourse>[];
}) {
  return (
    <section
      id="courses"
      className="bg-background py-20 lg:py-28"
    >
      <Container width="page">
        <ScrollReveal>
          <SectionHeading
            eyebrow="دوره‌های زبان انگلیسی"
            title={
              <>
                مهارت‌هایی که <GradientText>واقعاً</GradientText> یاد می‌دی
              </>
            }
            description="گرامر، واژگان، شنیدن، خواندن، نوشتن و آیلتس — هر دوره روی یک مهارت مشخص تمرکز دارد."
          />
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mt-10">
            <PopularCoursesClient
              courses={courses}
              categories={courseCategories}
              accentClasses={accentClasses}
            />
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  6. WHY US                                                           */
/* ──────────────────────────────────────────────────────────────────── */

function WhyUsSection() {
  const reasons = [
    {
      icon: BookText,
      tone: "sky",
      title: "کتاب‌های استاندارد جهانی",
      desc: "از کتاب‌های استاندارد Setayesh (Milestones، Genius، Ace it!‌، Smart English، Smart plus) استفاده می‌کنیم — منابع معتبر آموزش زبان انگلیسی.",
    },
    {
      icon: GraduationCap,
      tone: "coral",
      title: "اساتید متخصص زبان",
      desc: "مدرس‌های ما مدرک بین‌المللی TESOL/TEFL دارند و حداقل ۵ سال سابقه تدریس به فارسی‌زبانان.",
    },
    {
      icon: Headphones,
      tone: "mint",
      title: "تمرین هر ۴ مهارت",
      desc: "در هر دوره، reading, writing, listening, speaking هر چهار مهارت به طور متعادل تقویت می‌شود.",
    },
    {
      icon: PenTool,
      tone: "sunny",
      title: "تمرین + آزمون + بازخورد",
      desc: "هر درس شامل تمرین، آزمون کوتاه و بازخورد شخصی مدرس است. فقط فیلم نمی‌بینی — یاد می‌گیری.",
    },
  ];
  const palette = {
    sky: "bg-kid-sky-50 text-kid-sky-600 dark:bg-kid-sky-500/15 dark:text-kid-sky-300",
    coral: "bg-kid-coral-50 text-kid-coral-600 dark:bg-kid-coral-500/15 dark:text-kid-coral-300",
    mint: "bg-kid-mint-50 text-kid-mint-600 dark:bg-kid-mint-500/15 dark:text-kid-mint-300",
    sunny: "bg-kid-sunny-50 text-kid-sunny-600 dark:bg-kid-sunny-500/15 dark:text-kid-sunny-300",
  };

  return (
    <section
      id="why"
      className="bg-surface-muted py-20 lg:py-28"
    >
      <Container width="page">
        <ScrollReveal>
          <SectionHeading
            eyebrow="چرا بصیر نو"
            title={
              <>
                <GradientText>۴ دلیل</GradientText> که ما فرق داریم
              </>
            }
            description="ما فقط آموزش نمی‌دهیم — روش یادگیری را طراحی کرده‌ایم."
          />
        </ScrollReveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {reasons.map((r, i) => {
            const Icon = r.icon;
            return (
              <ScrollReveal key={r.title} delay={i * 0.05}>
                <div className="flex items-start gap-4 rounded-2xl border border-app-border-subtle bg-surface p-5">
                  <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${palette[r.tone as keyof typeof palette]}`}>
                    <Icon className="size-6" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-fg-primary">
                      {r.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-loose text-fg-secondary">
                      {r.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  7. CTA                                                              */
/* ──────────────────────────────────────────────────────────────────── */

function CtaSection() {
  return (
    <section className="bg-kid-sky-50 py-20 lg:py-28 dark:bg-kid-sky-500/10">
      <Container width="narrow">
        <ScrollReveal>
          <div className="text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-pill bg-white px-4 py-1.5 text-sm font-bold text-kid-sky-600 shadow-sm dark:bg-surface dark:text-kid-sky-300">
              <Sparkles className="size-4" />
              اولین درس رایگان
            </span>
            <h2 className="font-display text-3xl font-extrabold text-fg-primary sm:text-4xl">
              آماده‌ای شروع کنی؟
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-loose text-fg-secondary">
              ثبت‌نام کمتر از ۳۰ ثانیه طول می‌کشه. اولین درس رایگانه.
              بدون تعهد، بدون کارت.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="brand" size="lg">
                <Link href="/register">
                  ثبت‌نام رایگان
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">سوالی دارم</Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
