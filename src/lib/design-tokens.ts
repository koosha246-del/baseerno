/**
 * Design Tokens — بصیر نو (Baseer No)
 * Single source of truth for the entire design system.
 *
 * Direction: "Bright Editorial Classroom"
 *   Warm paper surfaces, ink-like typography, hand-cut geometry and
 *   controlled primary colors inspired by notebooks and learning tools.
 *
 * Palette anchors:
 *   Ink        #17324D — readable editorial authority
 *   Teal       #087F8C — signature learning accent
 *   Persimmon  #E85D3F — energetic calls to action
 *   Paper      #FFF9ED — warm, low-glare canvas
 *
 * ⚠️  Keep these in sync with the CSS custom properties in globals.css
 */

// ─── Colors ───────────────────────────────────────────────────────────

export const colors = {
  background: "#FFF9ED",

  surface: "#FFFEF9",
  surfaceMuted: "#F4EEDC",
  surfaceSubtle: "#E9F5F2",
  surfaceElevated: "#FFFFFF",

  brand: {
    navy: "#17324D",
    blue: "#087F8C",
    amber: "#D89B19",
    gold: "#F2C14E",
  },

  accent: "#087F8C",

  text: {
    primary: "#17324D",
    secondary: "#425466",
    muted: "#66717D",
    inverse: "#FFFFFF",
  },

  border: {
    DEFAULT: "#CFC7B5",
    subtle: "#E6DECC",
    strong: "#9E9582",
  },

  success: "#17805C",
  warning: "#B87500",
  danger: "#C7422F",
  info: "#087F8C",
} as const;

// ─── Kid-friendly palette ──────────────────────────────────────────────

export const kidColors = {
  "sky": {
    "50": "#F0F9FF",
    "100": "#E0F2FE",
    "200": "#BAE6FD",
    "300": "#7DD3FC",
    "400": "#38BDF8",
    "500": "#0EA5E9",
    "600": "#0284C7",
  },
  "coral": {
    "50": "#FFF1F2",
    "100": "#FFE4E6",
    "200": "#FECDD3",
    "300": "#FDA4AF",
    "400": "#FB7185",
    "500": "#F43F5E",
    "600": "#E11D48",
  },
  "mint": {
    "50": "#ECFDF5",
    "100": "#D1FAE5",
    "200": "#A7F3D0",
    "300": "#6EE7B7",
    "400": "#34D399",
    "500": "#10B981",
    "600": "#059669",
  },
  "sunny": {
    "50": "#FFFBEB",
    "100": "#FEF3C7",
    "200": "#FDE68A",
    "300": "#FCD34D",
    "400": "#FBBF24",
    "500": "#F59E0B",
    "600": "#D97706",
  },
} as const;

// ─── Gradients ─────────────────────────────────────────────────────────

export const gradients = {
  brand: "linear-gradient(115deg, #087F8C 0%, #087F8C 58%, #E85D3F 58%, #E85D3F 100%)",
  brandReverse: "linear-gradient(115deg, #E85D3F 0%, #E85D3F 42%, #087F8C 42%, #087F8C 100%)",
  brandRtl: "linear-gradient(245deg, #087F8C 0%, #087F8C 58%, #E85D3F 58%, #E85D3F 100%)",
  brandSoft: "linear-gradient(135deg, #E9F5F2 0%, #FFF4D6 100%)",
  aurora: "radial-gradient(circle at 18% 22%, rgba(242,193,78,.34) 0 12%, transparent 13%), radial-gradient(circle at 86% 18%, rgba(232,93,63,.18) 0 15%, transparent 16%), linear-gradient(135deg, #FFF9ED 0%, #E9F5F2 100%)",
  text: "linear-gradient(105deg, #087F8C 0%, #087F8C 62%, #E85D3F 62%, #E85D3F 100%)",
  scrim: "linear-gradient(0deg, rgba(15, 23, 42, 0.45) 0%, transparent 100%)",
  glass: "linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.70) 100%)",
  // Kid-friendly gradients
  kidCandy: "linear-gradient(135deg, #F43F5E 0%, #F97316 50%, #FBBF24 100%)",
  kidCandyRtl: "linear-gradient(225deg, #F43F5E 0%, #F97316 50%, #FBBF24 100%)",
  kidSky: "linear-gradient(135deg, #0EA5E9 0%, #38BDF8 50%, #7DD3FC 100%)",
  kidSunrise: "linear-gradient(135deg, #F59E0B 0%, #FCD34D 50%, #FEF3C7 100%)",
  kidMeadow: "linear-gradient(135deg, #10B981 0%, #34D399 50%, #A7F3D0 100%)",
  kidCelebrate: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F43F5E 100%)",
  kidText: "linear-gradient(135deg, #0EA5E9 0%, #8B5CF6 100%)",
} as const;

// ─── Border Radius ─────────────────────────────────────────────────────

export const radii = {
  none: "0",
  xs: "2px",
  sm: "4px",
  DEFAULT: "8px",
  md: "10px",
  lg: "12px",
  xl: "16px",
  "2xl": "20px",
  "3xl": "24px",
  pill: "9999px",
} as const;

// ─── Shadows ───────────────────────────────────────────────────────────

export const shadows = {
  sm: "2px 3px 0 rgba(23, 50, 77, 0.10)",
  DEFAULT: "3px 4px 0 rgba(23, 50, 77, 0.12)",
  md: "5px 6px 0 rgba(23, 50, 77, 0.13)",
  lg: "7px 9px 0 rgba(23, 50, 77, 0.14)",
  xl: "10px 12px 0 rgba(23, 50, 77, 0.15)",
  glow: "3px 4px 0 rgba(23, 50, 77, 0.18)",
  "glow-lg": "6px 7px 0 rgba(23, 50, 77, 0.20)",
  "inner-sm": "inset 0 1px 2px rgba(15, 23, 42, 0.04)",
  inner: "inset 0 2px 4px rgba(15, 23, 42, 0.06)",
} as const;

// ─── Backdrop Blur ────────────────────────────────────────────────────

export const blur = {
  none: "0",
  sm: "4px",
  DEFAULT: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "40px",
  "3xl": "64px",
} as const;

// ─── Z-Index ──────────────────────────────────────────────────────────

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

// ─── Breakpoints ───────────────────────────────────────────────────────

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// ─── Typography ────────────────────────────────────────────────────────

export const typography = {
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },
} as const;

// ─── Durations ─────────────────────────────────────────────────────────

export const durations = {
  fast: "150ms",
  base: "300ms",
  slow: "500ms",
  reveal: "600ms",
  marquee: "40s",
} as const;

// ─── Easings ───────────────────────────────────────────────────────────

export const easings = {
  "ease-standard": "cubic-bezier(0.4, 0, 0.2, 1)",
  "ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "ease-luxury": "cubic-bezier(0.4, 0, 0.2, 1)",
  "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
  "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
} as const;

// ─── Animations ────────────────────────────────────────────────────────

export const animations = {
  "fade-in": "fade-in 0.3s ease-standard",
  "fade-up": "fade-up 0.5s ease-luxury",
  "fade-down": "fade-down 0.3s ease-standard",
  "scale-in": "scale-in 0.3s ease-spring",
  "slide-in-rtl": "slide-in-rtl 0.3s ease-luxury",
  floating: "floating 3s ease-in-out infinite",
  "marquee-rtl": "marquee-rtl 32s linear infinite",
  shimmer: "shimmer 1.6s linear infinite",
  "pulse-soft": "pulse-soft 2s ease-in-out infinite",
} as const;
