import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/**
 * SEO helpers — typed metadata + JSON-LD structured data builders.
 *
 * JSON-LD blocks emitted here cover:
 *  - EducationalOrganization (identity)
 *  - Organization (broader identity + logo + sameAs)
 *  - FAQPage (FAQ section content)
 */

/**
 * Open Graph image. The PNG version (`/og/default.png`, 1424×752) is
 * preferred because most social platforms rasterize/transform SVG
 * inconsistently — they often render with no fonts, broken glyphs,
 * or refuse to fetch it altogether.
 */
const OG_IMAGE = "/og/default.png";
const OG_IMAGE_WIDTH = 1424;
const OG_IMAGE_HEIGHT = 752;

/** Base site metadata applied at the root layout. */
export function buildBaseMetadata(): Metadata {
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${siteConfig.name} | ${siteConfig.tagline}`,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: [
      "آموزش زبان انگلیسی",
      "بصیر نو",
      "English learning",
      "گرامر انگلیسی",
      "آموزش آیلتس",
      "مکالمه انگلیسی",
      "زبان انگلیسی کودکان",
      "کلاس زبان آنلاین",
      "Interchange",
      "Connect",
    ],
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    applicationName: siteConfig.name,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: siteConfig.url,
      siteName: siteConfig.name,
      title: `${siteConfig.name} | ${siteConfig.tagline}`,
      description: siteConfig.description,
      images: [
        {
          url: OG_IMAGE,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteConfig.name} | ${siteConfig.tagline}`,
      description: siteConfig.description,
      images: [OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: "/icon.svg",
    },
    manifest: "/manifest.webmanifest",
    category: "education",
  };
}

/** EducationalOrganization + Organization JSON-LD. */
export function buildOrganizationLd() {
  const sameAs = Object.values(siteConfig.social);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${siteConfig.url}/#org`,
        name: siteConfig.name,
        alternateName: siteConfig.nameEn,
        url: siteConfig.url,
        logo: `${siteConfig.url}/icon.svg`,
        image: `${siteConfig.url}${OG_IMAGE}`,
        description: siteConfig.description,
        foundingDate: String(siteConfig.foundedYear),
        email: siteConfig.contact.email,
        telephone: siteConfig.contact.phoneHref,
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.contact.address,
          addressLocality: "تهران",
          addressCountry: "IR",
        },
        sameAs,
      },
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/icon.svg`,
        sameAs,
      },
    ],
  };
}

/** FAQPage JSON-LD — fed by the FAQ feature's Q&A pairs. */
export function buildFaqLd(
  faqs: ReadonlyArray<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

/** Build a <script type="application/ld+json"> element payload. */
export function ldJson(data: unknown): string {
  return JSON.stringify(data);
}

/** Course JSON-LD — for course detail pages. */
export function buildCourseLd(course: {
  title: string;
  description: string;
  price: number | null;
  rating: number;
  reviews: number;
  mentor: string;
  lessons: number;
  durationHours: number;
  level: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: {
      "@type": "EducationalOrganization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    educationalLevel: course.level,
    numberOfLessons: course.lessons,
    timeRequired: `PT${course.durationHours}H`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: course.rating,
      reviewCount: course.reviews,
      bestRating: 5,
      worstRating: 1,
    },
    instructor: {
      "@type": "Person",
      name: course.mentor,
    },
    ...(course.price
      ? {
          offers: {
            "@type": "Offer",
            price: course.price,
            priceCurrency: "IRR",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

/** BreadcrumbList JSON-LD — for any page with breadcrumb navigation. */
export function buildBreadcrumbLd(
  items: ReadonlyArray<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
