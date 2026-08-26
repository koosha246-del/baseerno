import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import typographyPlugin from "@tailwindcss/typography";
import {
  colors,
  kidColors,
  gradients,
  radii,
  shadows,
  blur,
  zIndex,
  breakpoints,
  typography,
  durations,
  easings,
  animations,
} from "./src/lib/design-tokens";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
      },
      screens: {
        "2xl": breakpoints["2xl"],
      },
    },
    extend: {
      colors: {
        // Theme-aware tokens — resolved at runtime from the CSS custom
        // properties defined in globals.css so the light/dark class on
        // <html> switches EVERY surface, not just the header.
        background: "var(--background)",
        surface: {
          DEFAULT: "var(--surface)",
          muted: "var(--surface-muted)",
          subtle: "var(--surface-subtle)",
          elevated: "var(--surface-elevated)",
        },
        brand: {
          ...colors.brand,
          DEFAULT: "#1E5FD9",
          dark: "#1747A8",
        },
        // Dim scrim behind sheets/dialogs.
        overlay: "#0B1220",
        destructive: {
          DEFAULT: "#DC2626",
          soft: "#FEE2E2",
        },
        accent: {
          DEFAULT: "var(--theme-accent)",
          hover: "var(--theme-accent-hover)",
          soft: "var(--theme-accent-soft)",
          softHover: "var(--theme-accent-soft-hover)",
        },
        fg: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          inverse: "var(--text-inverse)",
          brand: "var(--text-brand)",
        },
        "app-border": {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        status: {
          success: colors.success,
          warning: colors.warning,
          danger: colors.danger,
          info: colors.info,
        },
        // Kid-facing palette — use for child-targeted surfaces.
        // Each scale follows Tailwind's 50→600 convention.
        kid: kidColors,
        // Landing page palette (Basir Academy branding)
        navy: {
          DEFAULT: "#0e2a54",
          deep: "#0a1f40",
        },
        sun: {
          DEFAULT: "#ffc53d",
          soft: "#fff4d6",
        },
        tang: {
          DEFAULT: "#f4772e",
          soft: "#feeadd",
        },
        leaf: {
          DEFAULT: "#27b876",
          soft: "#e2f6ec",
        },
        ink: {
          DEFAULT: "#16273f",
          soft: "#5a6b84",
        },
        "brand-tint": {
          DEFAULT: "#eff5fd",
          2: "#f6f9fe",
        },
      },
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "IranSans", "system-ui", "sans-serif"],
        display: ["var(--font-vazirmatn)", "IranSans", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-hero": ["4rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        hero: ["2.75rem", { lineHeight: "1.2", letterSpacing: "-0.005em" }],
        "section-title": ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.005em" }],
        "card-title": ["1.75rem", { lineHeight: "1.4" }],
        subtitle: ["1.5rem", { lineHeight: "1.5" }],
        lead: ["1.25rem", { lineHeight: "1.85" }],
        "body-lg": ["1.125rem", { lineHeight: "1.85" }],
        body: ["1rem", { lineHeight: "1.85" }],
        "body-sm": ["0.875rem", { lineHeight: "1.75" }],
        caption: ["0.8125rem", { lineHeight: "1.6" }],
        micro: ["0.75rem", { lineHeight: "1.5" }],
      },
      fontWeight: { ...typography.fontWeight },
      borderRadius: { ...radii },
      boxShadow: { ...shadows },
      backdropBlur: { ...blur },
      zIndex: {
        hide: "-1",
        base: "0",
        decor: "10",
        dropdown: "1000",
        sticky: "1020",
        header: "1030",
        sheet: "1100",
        overlay: "1200",
        modal: "1300",
        popover: "1400",
        toast: "1500",
        tooltip: "1600",
      },
      screens: {
        xs: "425px",
        ...breakpoints,
      },
      maxWidth: {
        page: "1200px",
        narrow: "960px",
        wide: "1320px",
      },
      backgroundImage: () => ({
        "brand-gradient": gradients.brand,
        "brand-gradient-reverse": gradients.brandReverse,
        "brand-gradient-rtl": gradients.brandRtl,
        "brand-soft": gradients.brandSoft,
        "aurora": gradients.aurora,
        "text-gradient": gradients.text,
        "scrim": gradients.scrim,
        "glass": gradients.glass,
        // Kid-friendly gradients — candy / sky / meadow palettes.
        "kid-candy": gradients.kidCandy,
        "kid-candy-rtl": gradients.kidCandyRtl,
        "kid-sky": gradients.kidSky,
        "kid-sunrise": gradients.kidSunrise,
        "kid-meadow": gradients.kidMeadow,
        "kid-celebrate": gradients.kidCelebrate,
        "kid-text": gradients.kidText,
      }),
      transitionDuration: {
        ...durations,
      },
      transitionTimingFunction: {
        ...easings,
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-down": {
          from: { opacity: "0", transform: "translateY(-24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-rtl": {
          from: { opacity: "0", transform: "translateX(-32px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        floating: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "marquee-rtl": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
      },
      animation: {
        ...animations,
        "accordion-down": "accordion-down 0.3s ease-standard",
        "accordion-up": "accordion-up 0.3s ease-standard",
        "float-soft": "float-soft 5s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate, typographyPlugin],
};

export default config;
