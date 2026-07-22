import { navigation, headerCta } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import type { HeaderData } from "./types";

/**
 * Header feature data — derived from the central navigation + site config
 * so the header never drifts from the rest of the app.
 *
 * Icons are stored as serializable string keys (resolved client-side) to
 * keep this server module's exports safe across the server/client boundary.
 */
export const headerData: HeaderData = {
  logoText: siteConfig.name,
  logoSub: siteConfig.tagline,
  nav: navigation.map((item) => ({
    id: item.id,
    label: item.label,
    href: `#${item.id}`,
  })),
  cta: {
    label: headerCta.label,
    href: headerCta.href,
    iconKey: "graduation-cap",
  },
};

/** Phone CTA shown on desktop (contact shortcut). */
export const headerPhone = {
  label: "کمک می‌خوای؟",
  href: "tel:" + siteConfig.contact.phoneHref,
  iconKey: "phone" as const,
  display: siteConfig.contact.phone,
};
