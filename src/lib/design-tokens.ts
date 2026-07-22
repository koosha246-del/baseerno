/**
 * Design Tokens — بصیر نو (Baseer No)
 * Single source of truth for the entire design system.
 *
 * Audience: school students learning English — calm, clear, friendly.
 *
 * ## Color psychology for kids + learning
 *
 * Two complementary palettes, applied per surface:
 *
 * **`brand`** — sophisticated, trust-building (parents see this)
 *   - Navy / Blue  → calm focus, trust, concentration while studying
 *   - Sky / Teal   → freshness, open mind, easy start
 *   - Green        → growth, progress, "I improved today"
 *   - Amber / Gold → joy, energy, small wins & certificates
 *
 * **`kid`** — playful, warm, friendly (children feel this)
 *   - Sky Blue (#38BDF8)  → trust + imagination, "the sky is the limit"
 *   - Coral Pink (#FB7185) → warmth + safety, "I'm loved"
 *   - Mint Green (#34D399) → growth + freshness, "I learned something new"
 *   - Sunny Yellow (#FBBF24) → joy + optimism, "I did it!"
 *   - Lavender (#A78BFA) → calm + creativity, "I can imagine"
 *   - Peach (#FDBA74) → cozy + welcoming, "this is for me"
 *   - Soft cream (#FFF7ED) → low-stim background, not stark white
 *
 * Both palettes share the same 4-stop brand gradient as a chromatic
 * anchor so the site never feels like two separate products.
 *
 * Source of visual truth: brand gradient #1E3A5F → #2563EB → #D4A017 → #F5C518
 */

export const colors = {
  // Brand gradient stops (primary direction)
  // Deep navy → royal blue → golden amber → warm gold
  brand: {
    navy: "#1E3A5F",
    blue: "#2563EB",
    amber: "#D4A017",
    gold: "#F5C518",
  },

  // Primary surface scale
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceMuted: "#F8F7FB",
  surfaceSubtle: "#EFECE7",
  surfaceElevated: "#FFFFFF",
  overlay: "rgba(17, 24, 39, 0.55)",

  // Text scale — tuned for WCAG AA on white (#0F172A ≈ 7:1)
  text: {
    primary: "#0F172A",
    secondary: "#3D4551",
    muted: "#5A6272",
    inverse: "#FFFFFF",
    brand: "#1B4FD4",
  },

  // Borders & dividers
  border: {
    subtle: "#E8E4DF",
    DEFAULT: "#D9D5D0",
    strong: "#C4BFB9",
  },

  // Semantic / status
  success: "#15803D",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#1B4FD4",

  // Accent solids — deeper, more distinguished blue
  accent: {
    DEFAULT: "#1B4FD4",
    hover: "#153AA8",
    soft: "#E8EDF8",
    softHover: "#D4DCE8",
  },
} as const;

/**
 * Kid-facing palette — warm, friendly, optimistic.
 *
 * Use for child-targeted surfaces: course tiles for young learners,
 * certificate borders, achievement badges, and the kids-area hero.
 * Keep the existing `colors.brand` (navy + gold) for trust-bearing
 * surfaces like auth pages, payments, and admin tools.
 *
 * Each color carries a "why" comment for designers & developers.
 */
export const kidColors = {
  /** Sky blue — trust + imagination. Use as primary kid accent. */
  sky: {
    50: "#F0F9FF",
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8", // primary
    500: "#0EA5E9",
    600: "#0284C7",
  },
  /** Coral pink — warmth + safety. Friendly, non-aggressive. */
  coral: {
    50: "#FFF1F2",
    100: "#FFE4E6",
    200: "#FECDD3",
    300: "#FDA4AF",
    400: "#FB7185", // primary
    500: "#F43F5E",
    600: "#E11D48",
  },
  /** Mint green — growth + freshness. "I learned something new!" */
  mint: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399", // primary
    500: "#10B981",
    600: "#059669",
  },
  /** Sunny yellow — joy + optimism. "I did it!" */
  sunny: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24", // primary
    500: "#F59E0B",
    600: "#D97706",
  },
  /** Lavender — calm + creativity. "I can imagine." */
  lavender: {
    50: "#F5F3FF",
    100: "#EDE9FE",
    200: "#DDD6FE",
    300: "#C4B5FD",
    400: "#A78BFA", // primary
    500: "#8B5CF6",
    600: "#7C3AED",
  },
  /** Peach — cozy + welcoming. "This is for me." */
  peach: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74", // primary
    400: "#FB923C",
    500: "#F97316",
  },
  /** Cream — low-stim background. Warm, not stark white. */
  cream: {
    DEFAULT: "#FFF7ED",
    soft: "#FFFBF5",
    warm: "#FEF3E8",
  },
} as const;

export const gradients = {
  /** Signature 4-stop brand gradient (navy → blue → amber → gold). */
  brand:
    "linear-gradient(90deg, #1E3A5F 0%, #2563EB 33%, #D4A017 66%, #F5C518 100%)",
  brandReverse:
    "linear-gradient(270deg, #1E3A5F 0%, #2563EB 33%, #D4A017 66%, #F5C518 100%)",
  /** RTL-friendly brand gradient flowing right-to-left. */
  brandRtl:
    "linear-gradient(270deg, #F5C518 0%, #D4A017 33%, #2563EB 66%, #1E3A5F 100%)",
  /** Softer version used on cards & chips. */
  brandSoft:
    "linear-gradient(135deg, rgba(27,79,212,0.10) 0%, rgba(212,160,23,0.10) 100%)",
  /** Warm aurora used behind hero. */
  aurora:
    "radial-gradient(55% 55% at 18% 22%, rgba(27,79,212,0.22) 0%, rgba(27,79,212,0) 60%), radial-gradient(45% 45% at 85% 28%, rgba(245,197,24,0.20) 0%, rgba(245,197,24,0) 60%), radial-gradient(50% 50% at 60% 88%, rgba(212,160,23,0.16) 0%, rgba(212,160,23,0) 60%)",
  /** Subtle text gradient for headlines. */
  text:
    "linear-gradient(120deg, #1E3A5F 0%, #1B4FD4 40%, #D4A017 70%, #F5C518 100%)",
  /** Neutral overlay for images. */
  scrim: "linear-gradient(180deg, rgba(17,24,39,0) 0%, rgba(17,24,39,0.65) 100%)",
  glass:
    "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.70) 100%)",

  /**
   * Kid-friendly gradient set — applied to child-facing surfaces so
   * the chrome reads as warm + playful without abandoning brand
   * identity. Each gradient flows sky → coral → mint → sunny to
   * evoke a candy / storybook feel.
   */
  kidCandy:
    "linear-gradient(120deg, #38BDF8 0%, #A78BFA 35%, #FB7185 65%, #FBBF24 100%)",
  kidCandyRtl:
    "linear-gradient(270deg, #38BDF8 0%, #A78BFA 35%, #FB7185 65%, #FBBF24 100%)",
  kidSky:
    "linear-gradient(180deg, #BAE6FD 0%, #E0F2FE 50%, #F0F9FF 100%)",
  kidSunrise:
    "linear-gradient(180deg, #FEF3C7 0%, #FED7AA 50%, #FECDD3 100%)",
  kidMeadow:
    "linear-gradient(135deg, #D1FAE5 0%, #BAE6FD 60%, #E0F2FE 100%)",
  kidCelebrate:
    "linear-gradient(120deg, #FBBF24 0%, #FB7185 50%, #A78BFA 100%)",
  kidText:
    "linear-gradient(120deg, #0EA5E9 0%, #F43F5E 40%, #F59E0B 70%, #FBBF24 100%)",
} as const;

/**
 * Spacing scale — 4px base. Mirrors Tailwind's default scale but
 * made explicit so spacing is auditable and token-driven.
 */
export const spacing = {
  px: "1px",
  0: "0px",
  0.5: "2px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  14: "56px",
  16: "64px",
  20: "80px",
  24: "96px",
  28: "112px",
  32: "128px",
  36: "144px",
  40: "160px",
} as const;

export const containerWidths = {
  /** Full-bleed content width. */
  page: "1200px",
  /** Tighter content width for hero / pricing. */
  narrow: "960px",
  /** Wide marquee / gallery. */
  wide: "1320px",
} as const;

export const radii = {
  none: "0px",
  sm: "6px",
  DEFAULT: "10px",
  md: "14px",
  lg: "20px",
  xl: "28px",
  "2xl": "36px",
  "3xl": "44px",
  pill: "999px",
} as const;

export const blur = {
  none: "0px",
  sm: "4px",
  DEFAULT: "8px",
  md: "14px",
  lg: "20px",
  xl: "28px",
} as const;

export const shadows = {
  none: "none",
  xs: "0 1px 2px rgba(17, 24, 39, 0.04)",
  sm: "0 1px 3px rgba(17, 24, 39, 0.06), 0 1px 2px rgba(17, 24, 39, 0.04)",
  DEFAULT:
    "0 4px 16px rgba(17, 24, 39, 0.07), 0 2px 6px rgba(17, 24, 39, 0.04)",
  md: "0 8px 28px rgba(17, 24, 39, 0.09), 0 4px 12px rgba(17, 24, 39, 0.05)",
  lg: "0 16px 48px rgba(17, 24, 39, 0.12), 0 8px 24px rgba(17, 24, 39, 0.07)",
  xl: "0 28px 64px rgba(17, 24, 39, 0.16), 0 14px 32px rgba(17, 24, 39, 0.09)",
  "2xl": "0 40px 90px rgba(17, 24, 39, 0.20), 0 20px 44px rgba(17, 24, 39, 0.12)",
  /** Colored brand glow used on primary CTAs and hero cards. */
  glow: "0 12px 36px rgba(27, 79, 212, 0.30)",
  glowStrong: "0 20px 52px rgba(27, 79, 212, 0.40)",
  inner: "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(17,24,39,0.04)",
  // Kid-friendly colored glows — softer + warmer than the brand glow.
  glowSky: "0 12px 36px rgba(56, 189, 248, 0.35)",
  glowCoral: "0 12px 36px rgba(251, 113, 133, 0.32)",
  glowMint: "0 12px 36px rgba(52, 211, 153, 0.30)",
  glowSunny: "0 12px 36px rgba(251, 191, 36, 0.35)",
  glowLavender: "0 12px 36px rgba(167, 139, 250, 0.32)",
  // Tactile raised surface — the "squishy" feel kids expect.
  squishy:
    "0 2px 0 rgba(17,24,39,0.08), 0 8px 24px rgba(56, 189, 248, 0.18)",
} as const;

export const zIndex = {
  hide: -1,
  base: 0,
  decor: 10,
  dropdown: 1000,
  sticky: 1020,
  header: 1030,
  sheet: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  toast: 1500,
  tooltip: 1600,
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1440px",
} as const;

/**
 * Typography scale. Tokenized font sizes + weights + tracking/leading
 * so the premium editorial rhythm is preserved across sections.
 *
 * Note: Persian text needs slightly more line-height than Latin
 * for optimal readability, so leading values are tuned accordingly.
 */
export const typography = {
  fontFamily: {
    sans: "var(--font-vazirmatn), IranSans, system-ui, sans-serif",
    display: "var(--font-vazirmatn), IranSans, system-ui, sans-serif",
  },
  fontSize: {
    "display-hero": ["4rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
    hero: ["2.75rem", { lineHeight: "1.2", letterSpacing: "-0.005em" }],
    "section-title": ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.005em" }],
    "card-title": ["1.75rem", { lineHeight: "1.4" }],
    "subtitle": ["1.5rem", { lineHeight: "1.5" }],
    "lead": ["1.25rem", { lineHeight: "1.85" }],
    "body-lg": ["1.125rem", { lineHeight: "1.85" }],
    body: ["1rem", { lineHeight: "1.85" }],
    "body-sm": ["0.875rem", { lineHeight: "1.75" }],
    caption: ["0.8125rem", { lineHeight: "1.6" }],
    micro: ["0.75rem", { lineHeight: "1.5" }],
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },
} as const;

/**
 * Motion durations & easings.
 */
export const durations = {
  instant: "0.12s",
  fast: "0.2s",
  base: "0.3s",
  slow: "0.5s",
  reveal: "0.65s",
  ambient: "0.8s",
} as const;

export const easings = {
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  inOut: "cubic-bezier(0.45, 0, 0.15, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  // Alias kept for backward compatibility with existing components that
  // reference "ease-luxury". Maps to the standard ease for consistency.
  luxury: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const animations = {
  "fade-in": "fade-in var(--dur-base, 0.3s) var(--ease-standard, cubic-bezier(0.4, 0, 0.2, 1)) both",
  "fade-up": "fade-up var(--dur-reveal, 0.65s) var(--ease-standard, cubic-bezier(0.4, 0, 0.2, 1)) both",
  "fade-down": "fade-down var(--dur-reveal, 0.65s) var(--ease-standard, cubic-bezier(0.4, 0, 0.2, 1)) both",
  "scale-in": "scale-in var(--dur-base, 0.3s) var(--ease-spring, cubic-bezier(0.34,1.56,0.64,1)) both",
  "slide-in-rtl": "slide-in-rtl var(--dur-reveal, 0.65s) var(--ease-standard, cubic-bezier(0.4, 0, 0.2, 1)) both",
  floating: "floating 6s var(--ease-inOut, cubic-bezier(0.45,0,0.15,1)) ease-in-out infinite",
  "marquee-rtl": "marquee-rtl var(--dur-marquee, 40s) linear infinite",
  shimmer: "shimmer 1.6s linear infinite",
  "spin-slow": "spin 14s linear infinite",
  "pulse-soft": "pulse-soft 3.5s ease-in-out infinite",
} as const;

/** Aggregated token object (used by documentation / runtime inspection). */
export const designTokens = {
  colors,
  gradients,
  spacing,
  containerWidths,
  radii,
  blur,
  shadows,
  zIndex,
  breakpoints,
  typography,
  durations,
  easings,
  animations,
} as const;
