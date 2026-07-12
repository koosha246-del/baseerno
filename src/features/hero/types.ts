export interface HeroStat {
  value: string;
  label: string;
}

export interface HeroFeature {
  icon: string;
  title: string;
}

export interface HeroData {
  badge: string;
  titleLead: string;
  titleHighlight: string;
  titleTail: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  stats: HeroStat[];
  features: HeroFeature[];
}

/**
 * Theme colors that shift with each background image.
 * When the hero rotates to a new image, the accent / gradient
 * colors across the page transition to match that slide's mood.
 */
export interface SlideTheme {
  /** Primary accent color for buttons, badges, links. */
  accent: string;
  /** Hover variant of accent. */
  accentHover: string;
  /** Soft (tinted background) for chips. */
  accentSoft: string;
  /** CSS gradient for the text highlight in the hero headline. */
  textGradient: string;
  /** CSS gradient for brand elements (header accent, CTA glow). */
  brandGradient: string;
  /** Scrim / overlay tint used to maintain text readability over the image. */
  scrimColor: string;
}

/**
 * A single slide in the rotating background carousel.
 *
 * Unlike the old gradient-only slides, each slide now uses a real image
 * as its full-bleed background, with an associated SlideTheme that shifts
 * the page's accent colors when that slide is active.
 */
export interface CarouselSlide {
  /** Unique id for React keys & aria labels. */
  id: string;
  /** Image source (full-bleed background). */
  src: string;
  /** Optional blur hash / dominant color shown while the image loads. */
  placeholderColor?: string;
  /** Theme colors applied to the page when this slide is active. */
  theme: SlideTheme;
  /** Destination navigated to when the full-screen slide is clicked. */
  href: string;
  /** Short accessible label describing the slide. */
  label: string;
  /** Duration this slide stays as the full-screen background, in ms. */
  durationMs: number;
}
