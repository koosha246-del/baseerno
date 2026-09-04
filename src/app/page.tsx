import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { Hero } from "@/components/site/hero";
import { SkillsMarquee } from "@/components/site/skills-marquee";
import { WhyBasir } from "@/components/site/why-basir";
import { LearningJourney } from "@/components/site/learning-journey";
import { BooksShowcase } from "@/components/site/books-showcase";
import { ClassExperience } from "@/components/site/class-experience";
import { AboutAcademy } from "@/components/site/about-academy";
import { ParentsSection } from "@/components/site/parents-section";
import { AgeGroups } from "@/components/site/age-groups";
import { FinalCta } from "@/components/site/final-cta";
import { FaqSection } from "@/components/site/faq-section";
import { SiteFooter } from "@/components/site/site-footer";
import { siteConfig } from "@/lib/site-config";

/**
 * آموزشگاه زبان بصیر — صفحه‌ی فرود
 *
 * روایت صفحه (A modern learning journey):
 * Discover → Learn → Practice → Progress → Join
 *
 * کاملاً استاتیک رندر می‌شود (بدون وابستگی به دیتابیس) تا حتی
 * وقتی PostgreSQL/Redis در دسترس نیست هم صفحه‌ی اصلی همیشه بالا بیاید.
 */
export const metadata: Metadata = {
  title: `${siteConfig.name} | ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "/",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* پرش به محتوا — دسترس‌پذیری */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-navy focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-white"
      >
        پرش به محتوای اصلی
      </a>

      <SiteHeader />

      <main id="main">
        {/* ۱. آشنایی — قول اصلی برند */}
        <Hero />

        {/* نوار مهارت‌ها — گذار روایی */}
        <SkillsMarquee />

        {/* ۲. اعتماد — چرا بصیر؟ */}
        <WhyBasir />

        {/* ۳. مسیر یادگیری — نقشه راه */}
        <LearningJourney />

        {/* ۴. منابع واقعی — کتاب‌ها */}
        <BooksShowcase />

        {/* ۵. تجربه کلاس — زبان در عمل */}
        <ClassExperience />

        {/* ۶. آموزشگاه واقعی — ساختمان */}
        <AboutAcademy />

        {/* ۷. اعتماد والدین */}
        <ParentsSection />

        {/* ۸. گروه‌های سنی */}
        <AgeGroups />

        {/* ۹. اقدام نهایی — ثبت‌نام */}
        <FinalCta />

        {/* ۱۰. پاسخ به تردیدها */}
        <FaqSection />
      </main>

      <SiteFooter />
    </div>
  );
}
