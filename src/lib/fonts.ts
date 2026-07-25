import localFont from "next/font/local";

/**
 * Vazirmatn — Persian typeface from the Vazirmatn project (rastikerdar/vazirmatn).
 *
 * Why local and not `next/font/google`?
 *   The build environment cannot reach Google Fonts at build time (sandboxed
 *   network). Loading the font from Google would fail the production build
 *   with `Failed to download Vazirmatn from Google Fonts`. Serving the woff2
 *   files from `public/fonts/vazirmatn/` (already committed) and going through
 *   `next/font/local` gives us the same Next.js optimizations (preload,
 *   `font-display: swap`, zero layout shift via `adjustFontFallback`, CSS
 *   variable consumed by Tailwind) without any external fetch.
 *
 * Six weights (400/500/600/700/800/900) cover the design system's use cases.
 * Fallback chain matches the brief: IranSans → system-ui → sans-serif.
 */
export const vazirmatn = localFont({
  src: [
    {
      path: "../../public/fonts/vazirmatn/Vazirmatn-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/vazirmatn/Vazirmatn-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/vazirmatn/Vazirmatn-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/vazirmatn/Vazirmatn-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/vazirmatn/Vazirmatn-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/vazirmatn/Vazirmatn-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  display: "swap",
  preload: true,
  variable: "--font-vazirmatn",
  adjustFontFallback: "Arial",
  fallback: ["IranSans", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});
