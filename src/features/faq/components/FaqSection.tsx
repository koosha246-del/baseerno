import { Container } from "@/components/shared/Container";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { GradientText } from "@/components/shared/GradientText";
import {
  Accordion,
} from "@/components/ui/accordion";
import { FaqItem } from "./FaqItem";
import { faqData } from "../constants";

/**
 * FaqSection — section #8.
 *
 * Radix-powered single-select accordion. JSON-LD FAQPage schema is
 * injected from the homepage page.tsx using faqData.
 */
export function FaqSection() {
  return (
    <section id="faq" className="section-padding bg-surface-muted">
      <Container width="narrow">
        <SectionHeading
          eyebrow="سوالات متداول"
          title={
            <>
              پاسخ سوالات رایج درباره <GradientText>بصیر نو</GradientText>
            </>
          }
          description="پاسخ بیشترین سوالاتی که دانشجویان و سازمان‌ها از ما می‌پرسند اینجاست."
        />

        <ScrollReveal className="mt-10">
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {faqData.map((item) => (
              <FaqItem key={item.id} item={item} />
            ))}
          </Accordion>
        </ScrollReveal>
      </Container>
    </section>
  );
}
