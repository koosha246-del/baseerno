import { Container } from "@/components/shared/Container";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { GradientText } from "@/components/shared/GradientText";
import { CampusFeatureItem } from "./CampusFeatureItem";
import { CampusGalleryTile } from "./CampusGalleryTile";
import { campusFeatures, campusGallery } from "../constants";

/**
 * CampusSection — section #7.
 *
 * Masonry-style gallery of the academy environment + feature highlights.
 * All visual content rendered via CSS/SVG — zero external image dependency.
 */
export function CampusSection() {
  return (
    <section id="campus" className="section-padding bg-background">
      <SectionHeading
        eyebrow="محیط آکادمی"
        title={
          <>
            فضایی الهام‌بخش برای <GradientText>یادگیری</GradientText> و رشد
          </>
        }
        description="محیط حرفه‌ای بصیر نو با امکانات پیشرفته، فضاهای تعاملی و استودیوهای مجهز، بهترین بستر را برای رشد مهارت‌های شما فراهم می‌کند."
      />

      <Container width="wide" className="mt-12">
        {/* Gallery grid — masonry-like */}
        <ScrollReveal
          stagger
          staggerAmount={0.08}
          className="columns-1 gap-4 sm:columns-2 lg:columns-3"
        >
          {campusGallery.map((item) => (
            <div key={item.id} className="mb-4 break-inside-avoid">
              <CampusGalleryTile item={item} />
            </div>
          ))}
        </ScrollReveal>
      </Container>

      {/* Feature items */}
      <Container width="page" className="mt-14">
        <ScrollReveal
          stagger
          staggerAmount={0.1}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {campusFeatures.map((f) => (
            <CampusFeatureItem key={f.id} feature={f} />
          ))}
        </ScrollReveal>
      </Container>
    </section>
  );
}
