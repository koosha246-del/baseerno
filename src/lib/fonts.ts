import { Vazirmatn } from "next/font/google";

/**
 * Vazirmatn — loaded via next/font/google (Vazirmatn is on Google Fonts).
 *
 * This avoids shipping local woff2 files while still providing automatic
 * subsetting, font-display swap, zero layout shift, and a CSS variable
 * (--font-vazirmatn) consumed by the Tailwind `sans` / `display` families.
 *
 * Fallback chain matches the brief: IranSans → system-ui → sans-serif.
 *
 * Weights limited to those used by the design system to keep payload small.
 */
export const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal"],
  display: "swap",
  adjustFontFallback: true,
  preload: true,
  variable: "--font-vazirmatn",
  fallback: ["IranSans", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});
