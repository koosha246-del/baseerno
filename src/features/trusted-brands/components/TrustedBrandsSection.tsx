import { Container } from "@/components/shared/Container";
import { Marquee } from "@/components/shared/Marquee";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { BrandWordmark } from "./BrandWordmark";
import { trustedBrands } from "../constants";

/**
 * TrustedBrandsSection — section #4.
 *
 * Infinite logo marquee proving institutional trust. The strip pauses on
 * hover and fades at both edges via the marquee mask.
 */
export function TrustedBrandsSection() {
  return (
    <section id="brands" className="border-y border-app-border-subtle bg-surface py-12 lg:py-16">
      <Container width="page">
        <ScrollReveal className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="text-sm font-bold text-accent">اعتماد سازمان‌ها</span>
          <h2 className="font-display text-xl font-bold text-fg-secondary sm:text-2xl">
            بیش از ۵۰ سازمان و برند پیشرو به ما اعتماد کرده‌اند
          </h2>
        </ScrollReveal>
      </Container>

      <Marquee duration={42} pauseOnHover>
        {trustedBrands.map((brand) => (
          <BrandWordmark key={brand.name} brand={brand} />
        ))}
      </Marquee>
    </section>
  );
}
