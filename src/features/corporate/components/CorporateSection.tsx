import { Container } from "@/components/shared/Container";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { GradientText } from "@/components/shared/GradientText";
import { CorporateBenefitCard } from "./CorporateBenefitCard";
import { CorporateCtaForm } from "./CorporateCtaForm";
import { corporateBenefits, corporateCopy } from "../constants";

/**
 * CorporateSection — section #6.
 *
 * Split layout: benefits grid on the start, consultation CTA form on
 * the end. The form uses React Hook Form + Zod validation with Persian
 * error messages and a success state.
 */
export function CorporateSection() {
  return (
    <section id="corporate" className="section-padding bg-surface-muted">
      <Container width="page">
        <SectionHeading
          eyebrow={corporateCopy.sectionLabel}
          title={
            <>
              فن بیان را به <GradientText>دستاوردهای سازمانی</GradientText> تبدیل کنید
            </>
          }
          description={corporateCopy.description}
          align="center"
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Benefits grid */}
          <ScrollReveal
            stagger
            staggerAmount={0.08}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {corporateBenefits.map((b) => (
              <CorporateBenefitCard key={b.id} benefit={b} />
            ))}
          </ScrollReveal>

          {/* CTA form */}
          <ScrollReveal>
            <CorporateCtaForm />
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}
