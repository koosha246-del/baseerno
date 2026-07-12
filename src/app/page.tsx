import { SiteHeader } from "@/features/header/components/SiteHeader";
import { HeroSection } from "@/features/hero/components/HeroSection";
import { AchievementSection } from "@/features/achievements/components/AchievementSection";
import { TrustedBrandsSection } from "@/features/trusted-brands/components/TrustedBrandsSection";
import { PopularCoursesSection } from "@/features/courses/components/PopularCoursesSection";
import { CorporateSection } from "@/features/corporate/components/CorporateSection";
import { CampusSection } from "@/features/campus/components/CampusSection";
import { FaqSection } from "@/features/faq/components/FaqSection";
import { SiteFooter } from "@/features/footer/components/SiteFooter";
import { buildFaqLd, ldJson } from "@/lib/seo";
import { faqData } from "@/features/faq/constants";

/**
 * Homepage — thin composition file.
 *
 * Sections are imported and rendered in the exact required order.
 * The page itself is a server component; individual sections are
 * client components where they need interactivity.
 */
export default function HomePage() {
  return (
    <>
      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: ldJson(
            buildFaqLd(faqData.map((f) => ({ question: f.question, answer: f.answer })))
          ),
        }}
      />

      <SiteHeader />
      <main>
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Achievements */}
        <AchievementSection />

        {/* 3. Trusted Brands */}
        <TrustedBrandsSection />

        {/* 4. Popular Courses */}
        <PopularCoursesSection />

        {/* 5. Corporate Training */}
        <CorporateSection />

        {/* 6. Campus Experience */}
        <CampusSection />

        {/* 7. FAQ */}
        <FaqSection />
      </main>
      <SiteFooter />
    </>
  );
}
