import type { Metadata, Viewport } from "next";
import { vazirmatn } from "@/lib/fonts";
import { buildBaseMetadata, buildOrganizationLd, ldJson } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { Providers } from "@/providers/Providers";
import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";
import { GoogleAnalytics } from "@/components/shared/GoogleAnalytics";
import { CookieConsent } from "@/components/shared/CookieConsent";
import "./globals.css";

export const metadata: Metadata = buildBaseMetadata();

export const viewport: Viewport = {
  themeColor: "#1E3A5F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
      </head>
      <body className="min-h-screen bg-background text-fg-primary font-sans antialiased">
        <GoogleAnalytics />
        <ServiceWorkerRegistration />
        <a
          href="#home"
          className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[1600] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          رفتن به محتوای اصلی
        </a>
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  );
}
