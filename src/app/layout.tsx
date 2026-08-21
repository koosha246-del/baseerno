import type { Metadata, Viewport } from "next";
import { vazirmatn } from "@/lib/fonts";
import {
  buildBaseMetadata,
  buildOrganizationLd,
  buildWebSiteLd,
  ldJson,
} from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { Providers } from "@/providers/Providers";
import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";
import { GoogleAnalytics } from "@/components/shared/GoogleAnalytics";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { aria } from "@/constants/aria";
import "./globals.css";

export const metadata: Metadata = buildBaseMetadata();

export const viewport: Viewport = {
  themeColor: "#FFF9ED",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // CSP is applied as a static header in next.config.mjs (see the comment
  // there for why per-request nonces were dropped — they are incompatible
  // with ISR caching). We deliberately do NOT call headers() here — it
  // would force dynamic rendering and defeat ISR on course pages.
  // Inline JSON-LD (`application/ld+json`) is a data block and is not
  // subject to script-src, so it needs no nonce.
  return (
    <html
      lang={siteConfig.lang}
      dir={siteConfig.dir}
      className={vazirmatn.variable}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(buildOrganizationLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(buildWebSiteLd()) }}
        />
      </head>
      <body className="min-h-screen bg-background text-fg-primary font-sans antialiased">
        <GoogleAnalytics />
        <ServiceWorkerRegistration />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[1600] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          {aria.mainContent}
        </a>
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  );
}
