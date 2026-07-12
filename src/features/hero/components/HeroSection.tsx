import { Container } from "@/components/shared/Container";
import { HeroContent } from "./HeroContent";
import { HeroCarousel } from "./HeroCarousel";

/**
 * HeroSection — the page's above-the-fold focal point (section #2).
 *
 * A full-bleed rotating carousel sits behind the copy as a living background:
 * the brand logo (slide #1, ~60s) and demo photos cycle in and out of focus,
 * each clickable to its own destination. The hero copy & CTAs sit on top with
 * a higher z-index so their clicks always win.
 * Includes the #home anchor used by the header scroll-spy.
 */
export function HeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-background pt-[calc(var(--header-h)+2rem)] lg:pt-[calc(var(--header-h)+3.5rem)]"
    >
      {/* Rotating background carousel (logo first, then demo photos) */}
      <HeroCarousel />

      {/* Copy layer — above the carousel, so its CTAs always receive clicks.
          The carousel's focused image still receives clicks in the empty
          areas around the copy (it sits at z-10, this sits at z-20). */}
      <Container
        width="page"
        className="relative z-20 min-h-[88vh] pb-16 pt-8 lg:min-h-[92vh] lg:pb-24 lg:pt-12"
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <HeroContent />
          {/* Right column intentionally left empty: the rotating photo now acts
              as the visual, so a second static illustration would compete. */}
          <div className="hidden lg:block" aria-hidden />
        </div>
      </Container>
    </section>
  );
}
